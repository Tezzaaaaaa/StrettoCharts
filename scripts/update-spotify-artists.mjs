import { readFile, writeFile, mkdir } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const dataDir = new URL('./data/', root);
const followingPath = new URL('./data/following.json', root);
const outputPath = new URL('./data/spotify-artists.json', root);
const headers = { 'user-agent': 'Mozilla/5.0 StrettoCharts/1.0', 'accept': 'text/html,text/plain,*/*' };

const clean = value => String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const number = value => {
  const n = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

async function get(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.text();
}

function parseRows(html) {
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
    const streams = number(row[1]);
    const dailyStreams = number(row[2]);
    if (!row[0] || streams == null) continue;
    out.push({ title: row[0], streams, dailyStreams: dailyStreams ?? 0 });
  }
  return out.slice(0, 20);
}

function parseArtistAlbums(html) {
  const rows = parseRows(html);
  const out = [];
  for (const row of rows) {
    if (row.length < 3) continue;
    const streams = number(row[1]);
    const dailyStreams = number(row[2]);
    if (!row[0] || streams == null || dailyStreams == null) continue;
    if (/album title/i.test(row[0]) || /^streams$/i.test(row[0])) continue;
    out.push({ title: row[0], streams, dailyStreams });
  }
  return out.slice(0, 20);
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

function parseSongSummary(html) {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .split(/\n+/).map(clean).filter(Boolean);
  const find = label => {
    const index = text.findIndex(x => x.toLowerCase() === label.toLowerCase());
    return index >= 0 ? number(text[index + 1]) : null;
  };
  return {
    totalStreams: find('Streams'),
    dailyStreams: find('Daily'),
    tracks: find('Tracks')
  };
}

async function fetchArtist(artist) {
  const id = artist.spotifyArtistId;
  const base = `https://kworb.net/spotify/artist/${id}`;
  const [songsHtml, albumsHtml, listenersHtml] = await Promise.all([
    get(`${base}_songs.html`),
    get(`${base}_albums.html`),
    get('https://www.kworb.net/spotify/listeners.html')
  ]);
  return {
    ...artist,
    ...parseSongSummary(songsHtml),
    ...parseSummary(listenersHtml, artist.name),
    topSongs: parseArtistSongs(songsHtml),
    topAlbums: parseArtistAlbums(albumsHtml)
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
    schemaVersion: 1,
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
