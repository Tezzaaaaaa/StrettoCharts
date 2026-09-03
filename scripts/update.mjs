import { mkdir, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const DATA_DIR = new URL('./data/', ROOT);
const OUTPUT = new URL('./data/latest.json', ROOT);

const SOURCES = [
  { id: 'spotify-global-daily', name: 'Spotify Global Daily', type: 'daily', url: 'https://charts.spotify.com/charts/view/regional-global-daily/latest/download', parser: parseSpotifyCsv },
  { id: 'apple-global-daily', name: 'Apple Music Global Top 100', type: 'daily', url: 'https://rss.applemarketingtools.com/api/v2/us/music/most-played/100/songs.json', parser: parseAppleRss },
  { id: 'apple-australia-daily', name: 'Apple Music Australia Top 100', type: 'daily', url: 'https://rss.applemarketingtools.com/api/v2/au/music/most-played/100/songs.json', parser: parseAppleRss },
  { id: 'aria-australia-weekly', name: 'ARIA Top 50 Singles', type: 'weekly', url: 'https://www.aria.com.au/charts/singles-chart', parser: parseAriaHtml },
  { id: 'billboard-hot-100', name: 'Billboard Hot 100', type: 'weekly', url: 'https://www.billboard.com/charts/hot-100/', parser: parseBillboardHtml },
];

function clean(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }

function csvRows(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(field); field = ''; if (row.some(v => clean(v))) rows.push(row); row = []; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function parseSpotifyCsv(text) {
  const rows = csvRows(text); if (rows.length < 2) throw new Error('Spotify CSV contained no rows');
  const headers = rows[0].map(clean); const index = name => headers.findIndex(h => h.toLowerCase() === name);
  const rank = index('rank'), title = index('track_name'), artist = index('artist_names'), streams = index('streams'), date = index('date'), region = index('region');
  if (rank < 0 || title < 0 || artist < 0) throw new Error('Unexpected Spotify CSV schema');
  return rows.slice(1).map(r => ({ rank: Number(r[rank]), title: clean(r[title]), artists: clean(r[artist]).split(',').map(clean).filter(Boolean), streams: streams >= 0 ? Number(r[streams]) || null : null, chartDate: date >= 0 ? clean(r[date]) : null, region: region >= 0 ? clean(r[region]) : 'Global' })).filter(x => Number.isFinite(x.rank) && x.title);
}

function parseAppleRss(text) {
  const json = JSON.parse(text); const results = Array.isArray(json.feed?.results) ? json.feed.results : [];
  return results.map((item, i) => ({ rank: i + 1, title: clean(item.name), artists: [clean(item.artistName)].filter(Boolean), album: clean(item.collectionName) || null, url: item.url || null, artworkUrl: item.artworkUrl100 || null, chartDate: json.feed?.updated || null })).filter(x => x.title);
}

function parseAriaHtml(text) {
  const normalized = text.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const stripped = normalized.replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  const lines = stripped.split(/\n+/).map(clean).filter(Boolean); const out = [];
  for (let i = 0; i < lines.length && out.length < 50; i++) {
    if (!/^\d+$/.test(lines[i])) continue; const rank = Number(lines[i]); if (rank < 1 || rank > 50) continue;
    const title = lines[i + 1], artist = lines[i + 2]; if (!title || !artist || /^\d+$/.test(title)) continue;
    const next = lines.slice(i + 3, i + 9);
    out.push({ rank, title, artists: artist.split(',').map(clean).filter(Boolean), lastWeek: next.find(v => /last week/i.test(v)) || null, peak: next.find(v => /peak/i.test(v)) || null, weeksInChart: next.find(v => /weeks in/i.test(v)) || null });
  }
  return dedupeByRank(out);
}

function parseBillboardHtml(text) {
  const out = [];
  const patterns = [
    /c-title[^>]*>([\s\S]*?)<\/h3>[\s\S]*?c-label[^>]*>([\s\S]*?)<\/span>/gi,
    /o-chart-results-list__item-title[^>]*>([\s\S]*?)<\/h3>[\s\S]*?o-chart-results-list__item-excerpt[^>]*>([\s\S]*?)<\/span>/gi,
  ];
  for (const re of patterns) { let m; while ((m = re.exec(text)) && out.length < 100) { const title = clean(m[1].replace(/<[^>]+>/g, '')), artist = clean(m[2].replace(/<[^>]+>/g, '')); if (title && artist) out.push({ rank: out.length + 1, title, artists: [artist] }); } if (out.length) break; }
  if (!out.length) throw new Error('Billboard markup did not expose chart rows'); return out;
}

function dedupeByRank(rows) { return [...new Map(rows.map(row => [row.rank, row])).values()].sort((a, b) => a.rank - b.rank); }

async function fetchSource(source) {
  const response = await fetch(source.url, { headers: { 'user-agent': 'StrettoCharts/1.0 (+https://github.com/Tezzaaaaaa/StrettoCharts)', accept: 'text/html,application/json,text/csv;q=0.9,*/*;q=0.8' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`); const text = await response.text(); const entries = source.parser(text); if (!entries.length) throw new Error('No chart entries parsed'); return entries;
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true }); const updatedAt = new Date().toISOString();
  const results = await Promise.all(SOURCES.map(async source => {
    try { const entries = await fetchSource(source); return { id: source.id, name: source.name, type: source.type, sourceUrl: source.url, status: 'ok', fetchedAt: updatedAt, count: entries.length, entries }; }
    catch (error) { return { id: source.id, name: source.name, type: source.type, sourceUrl: source.url, status: 'error', fetchedAt: updatedAt, count: 0, error: error instanceof Error ? error.message : String(error), entries: [] }; }
  }));
  const payload = { schemaVersion: 1, generatedAt: updatedAt, sources: results }; await writeFile(OUTPUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  const ok = results.filter(x => x.status === 'ok'); console.log(`StrettoCharts updated: ${ok.length}/${results.length} sources succeeded`); for (const result of results) console.log(`${result.status.toUpperCase()} ${result.id}: ${result.count}`); if (!ok.length) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
