import { readFile, writeFile, mkdir } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const dataDir = new URL('./data/', root);
const followingPath = new URL('./data/following.json', root);
const outputPath = new URL('./data/spotify-artists.json', root);
const headers = { 'user-agent': 'Mozilla/5.0 StrettoCharts/1.0', 'accept': 'text/html,text/plain,*/*' };

const clean = value => String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/`/g, '').replace(/\s+/g, ' ').trim();
const number = value => {
  const n = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

async function get(url) {
  const response = await fetch(`https://r.jina.ai/${url}`, { headers: { ...headers, accept: 'text/plain' } });
  if (!response.ok) throw new Error(`HTTP ${response.status} from Reader for ${url}`);
  return response.text();
}

function parseRows(html) {
  const markdown = String(html).split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith('|') && line.endsWith('|')).map(line => line.slice(1, -1).split('|').map(clean)).filter(row => row.length && !row.every(cell => /^[-: ]+$/.test(cell)));
  if (markdown.length) return markdown;
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map(match => [...match[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map(x => clean(x[1])))
    .filter(row => row.length);
}

function parseArtistSongs(html) {
  const rows = parseRows(html);
  const header = rows.findIndex(row => row.some(x => /song title/i.test(x)) && row.some(x => /^streams$/i.test(x)));
  if (header < 0) throw new Error('Spotify artist song table not found');
  const out = [];
  for (const row of rows.slice(header + 1)) {
    if (row.length < 3) continue;
    const title = row[0].replace(/^[*^]\s+/, '');
    const streams = number(row[1]);
    const dailyStreams = number(row[2]);
    if (!title || streams == null) continue;
    out.push({ title, streams, dailyStreams: dailyStreams ?? 0 });
  }
  return out;
}

function parseArtistAlbums(html) {
  const rows = parseRows(html);
  const out = [];
  for (const row of rows) {
    if (row.length < 3) continue;
    const title = row[0].replace(/^[*^]\s+/, '');
    const streams = number(row[1]);
    const dailyStreams = number(row[2]);
    if (!title || streams == null || dailyStreams == null) continue;
    if (/album title/i.test(title) || /^streams$/i.test(title)) continue;
    out.push({ title, streams, dailyStreams });
  }
  return out;
}

function parseSummary(html, artistName) {
  const rows = parseRows(html);
  const headerIndex = rows.findIndex(r => r.some(x => /^listeners$/i.test(x)) && r.some(x => /daily/i.test(x)));
  if (headerIndex < 0) return {};
  const header = rows[headerIndex].map(x => x.toLowerCase());
  const artistIndex = header.findIndex(x => /artist/.test(x));
  const listenersIndex = header.findIndex(x => /^listeners$/.test(x));
  const dailyIndex = header.findIndex(x => /daily/.test(x));
  const peakIndex = header.findIndex(x => /^peak$/i.test(x));
  const row = rows.slice(headerIndex + 1).find(r => r[artistIndex] && r[artistIndex].toLowerCase() === artistName.toLowerCase());
  if (!row || listenersIndex < 0) return {};
  return {
    monthlyListeners: number(row[listenersIndex]),
    monthlyListenersDailyChange: dailyIndex >= 0 ? number(row[dailyIndex]) : null,
    monthlyListenersPeak: peakIndex >= 0 ? number(row[peakIndex]) : null
  };
}

function parseChartHistory(html) {
  const rows = parseRows(html);
  const headerIndex = rows.findIndex(row => /^peak date$/i.test(row[0] || '') && /^title$/i.test(row[1] || '') && /^streams$/i.test(row[2] || ''));
  if (headerIndex < 0) throw new Error('Spotify chart-history table not found');
  const markets = rows[headerIndex].slice(3);
  const history = [];
  for (const row of rows.slice(headerIndex + 1)) {
    if (row.length < 3 || !/^\d{4}\/\d{2}\/\d{2}$/.test(row[0])) continue;
    const title = row[1].replace(/^[*^]\s+/, '');
    const streams = number(row[2]);
    if (!title || streams == null) continue;
    const peaks = {};
    markets.forEach((market, i) => {
      const value = row[i + 3];
      if (value && value !== '--') {
        const rank = number(value);
        if (rank != null) peaks[market] = rank;
      }
    });
    history.push({ peakDate: row[0], title, streams, peaks });
  }
  return { markets, rows: history };
}

function parseSongSummary(html) {
  const rows = parseRows(html);
  const headerIndex = rows.findIndex(row => row.some(x => /^streams$/i.test(x)) && row.some(x => /^daily$/i.test(x)) && row.some(x => /^tracks$/i.test(x)));
  if (headerIndex < 0) return {};
  const header = rows[headerIndex].map(x => x.toLowerCase());
  const totalIndex = header.indexOf('total');
  const leadIndex = header.indexOf('as lead');
  const soloIndex = header.indexOf('solo');
  const featureIndex = header.indexOf('as feature (*)');
  const row = rows[headerIndex + 1];
  const dailyRow = rows[headerIndex + 2];
  const tracksRow = rows[headerIndex + 3];
  return {
    totalStreams: row && totalIndex >= 0 ? number(row[totalIndex]) : null,
    dailyStreams: dailyRow && totalIndex >= 0 ? number(dailyRow[totalIndex]) : null,
    tracks: tracksRow && totalIndex >= 0 ? number(tracksRow[totalIndex]) : null,
    leadStreams: row && leadIndex >= 0 ? number(row[leadIndex]) : null,
    soloStreams: row && soloIndex >= 0 ? number(row[soloIndex]) : null,
    featureStreams: row && featureIndex >= 0 ? number(row[featureIndex]) : null,
    leadTracks: tracksRow && leadIndex >= 0 ? number(tracksRow[leadIndex]) : null,
    soloTracks: tracksRow && soloIndex >= 0 ? number(tracksRow[soloIndex]) : null,
    featureTracks: tracksRow && featureIndex >= 0 ? number(tracksRow[featureIndex]) : null
  };
}

async function fetchArtist(artist) {
  const id = artist.spotifyArtistId;
  const base = `https://www.kworb.net/spotify/artist/${id}`;
  const [songsHtml, albumsHtml, chartHtml, listenersHtml] = await Promise.all([
    get(`${base}_songs.html`),
    get(`${base}_albums.html`),
    get(`${base}.html`),
    get('https://www.kworb.net/spotify/listeners.html')
  ]);
  return {
    ...artist,
    ...parseSongSummary(songsHtml),
    ...parseSummary(listenersHtml, artist.name),
    songs: parseArtistSongs(songsHtml),
    albums: parseArtistAlbums(albumsHtml),
    topSongs: parseArtistSongs(songsHtml).slice(0, 10),
    topAlbums: parseArtistAlbums(albumsHtml).slice(0, 10),
    chartHistory: parseChartHistory(chartHtml)
  };
}

async function main() {
  await mkdir(dataDir, { recursive: true });
  const following = JSON.parse(await readFile(followingPath, 'utf8'));
  const previous = JSON.parse(await readFile(outputPath, 'utf8')).artists || [];
  const results = [];
  for (const artist of following) {
    try {
      results.push(await fetchArtist(artist));
      console.log(`OK Spotify artist: ${artist.name}`);
    } catch (error) {
      const old = previous.find(x => x.spotifyArtistId === artist.spotifyArtistId);
      if (old) results.push({ ...old, ...artist, stale: true, error: String(error) });
      else results.push({ ...artist, stale: true, error: String(error) });
      console.error(`ERROR Spotify artist ${artist.name}: ${error}`);
    }
  }
  const payload = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    source: 'Kworb Spotify statistics (third-party public tracker)',
    artists: results
  };
  await writeFile(outputPath, JSON.stringify(payload, null, 2) + '\n');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
