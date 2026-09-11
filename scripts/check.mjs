import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const readJson = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const fail = message => { throw new Error(message); };

const latest = await readJson('./data/latest.json');
if (latest?.schemaVersion !== 3) fail('data/latest.json: unsupported schemaVersion');
if (!latest?.generatedAt) fail('data/latest.json: missing generatedAt');
if (!Array.isArray(latest.sources) || latest.sources.length === 0) fail('data/latest.json: no sources');

const sourceIds = new Set();
for (const source of latest.sources) {
  if (!source?.id || !source?.name) fail('data/latest.json: source missing id/name');
  if (sourceIds.has(source.id)) fail(`data/latest.json: duplicate source id ${source.id}`);
  sourceIds.add(source.id);
  if (!['ok', 'error'].includes(source.status)) fail(`${source.id}: invalid status`);
  if (!Array.isArray(source.entries)) fail(`${source.id}: entries is not an array`);
  if (source.status === 'ok' && source.entries.length === 0) fail(`${source.id}: successful source has no entries`);

  const ranks = new Set();
  for (const entry of source.entries) {
    if (!Number.isInteger(entry.rank) || entry.rank < 1) fail(`${source.id}: invalid rank`);
    if (ranks.has(entry.rank)) fail(`${source.id}: duplicate rank ${entry.rank}`);
    ranks.add(entry.rank);
    if (!entry.title || !Array.isArray(entry.artists) || entry.artists.length === 0) fail(`${source.id}: incomplete chart entry at rank ${entry.rank}`);
    if (entry.previousRank != null && (!Number.isInteger(entry.previousRank) || entry.previousRank < 1)) fail(`${source.id}: invalid previousRank at rank ${entry.rank}`);
    if (entry.peakRank != null && (!Number.isInteger(entry.peakRank) || entry.peakRank < 1)) fail(`${source.id}: invalid peakRank at rank ${entry.rank}`);
    if (entry.weeksOnChart != null && (!Number.isInteger(entry.weeksOnChart) || entry.weeksOnChart < 1)) fail(`${source.id}: invalid weeksOnChart at rank ${entry.rank}`);
  }
}

if (!Array.isArray(latest.artistRankings)) fail('data/latest.json: artistRankings is not an array');
for (const artist of latest.artistRankings) {
  if (!artist?.artist || !Number.isInteger(artist.rank) || artist.rank < 1) fail('data/latest.json: invalid artist ranking');
}

const historyIndex = await readJson('./data/history/index.json');
if (!Array.isArray(historyIndex) || historyIndex.length === 0) fail('data/history/index.json: no history dates');
if (new Set(historyIndex).size !== historyIndex.length) fail('data/history/index.json: duplicate dates');

for (const date of historyIndex) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`history index: invalid date ${date}`);
  const snapshot = await readJson(`./data/history/${date}.json`);
  if (snapshot?.schemaVersion !== 3) fail(`history/${date}.json: unsupported schemaVersion`);
  if (!Array.isArray(snapshot.sources) || snapshot.sources.length === 0) fail(`history/${date}.json: no sources`);
}

const dashboard = await readFile(new URL('./dashboard.html', root), 'utf8');
const index = await readFile(new URL('./index.html', root), 'utf8');
const search = await readFile(new URL('./search-enhancements.js', root), 'utf8');
const artwork = await readFile(new URL('./artwork-provider.js', root), 'utf8');

for (const [name, text, required] of [
  ['dashboard.html', dashboard, ['id="searchForm"', 'id="search"', 'id="results"', 'artwork-provider.js', 'search-enhancements.js']],
  ['index.html', index, ['dashboard.html']],
  ['search-enhancements.js', search, ['result-sections', 'Artist', 'Song', 'Album', 'Other']],
  ['artwork-provider.js', artwork, ['itunes.apple.com/search', 'deezer.com']]
]) {
  for (const marker of required) if (!text.includes(marker)) fail(`${name}: missing required marker ${marker}`);
}

console.log(`StrettoCharts check passed: ${latest.sources.length} sources, ${historyIndex.length} history snapshots.`);
