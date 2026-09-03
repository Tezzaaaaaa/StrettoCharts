import { mkdir, writeFile, readFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const DATA_DIR = new URL('./data/', ROOT);
const LATEST = new URL('./data/latest.json', ROOT);
const HISTORY_DIR = new URL('./data/history/', ROOT);
const HISTORY_INDEX = new URL('./data/history/index.json', ROOT);

const SOURCES = [
  { id: 'spotify-global-daily', name: 'Spotify Global Daily', type: 'daily', url: 'https://charts.spotify.com/charts/view/regional-global-daily/latest/download', parser: parseSpotifyCsv },
  { id: 'spotify-global-viral', name: 'Spotify Global Viral 50', type: 'daily', url: 'https://charts.spotify.com/charts/view/viral-global/latest/download', parser: parseSpotifyCsv },
  { id: 'apple-global-daily', name: 'Apple Music Global Top 100', type: 'daily', url: 'https://rss.applemarketingtools.com/api/v2/us/music/most-played/100/songs.json', parser: parseAppleRss },
  { id: 'apple-australia-daily', name: 'Apple Music Australia Top 100', type: 'daily', url: 'https://rss.applemarketingtools.com/api/v2/au/music/most-played/100/songs.json', parser: parseAppleRss },
  { id: 'youtube-global-daily', name: 'YouTube Global Top Songs Daily', type: 'daily', url: 'https://charts.youtube.com/charts/TopSongs/global/daily', parser: parseYouTubeHtml },
  { id: 'youtube-global-weekly', name: 'YouTube Global Top Songs Weekly', type: 'weekly', url: 'https://charts.youtube.com/charts/TopSongs/global/weekly', parser: parseYouTubeHtml },
  { id: 'youtube-global-artists-weekly', name: 'YouTube Global Top Artists Weekly', type: 'weekly', url: 'https://charts.youtube.com/charts/TopArtists/global/weekly', parser: parseYouTubeArtistHtml },
  { id: 'deezer-global', name: 'Deezer Global Top Tracks', type: 'daily', url: 'https://api.deezer.com/chart/0/tracks?limit=100', parser: parseDeezerJson },
  { id: 'shazam-us-weekly', name: 'Shazam US Top 200', type: 'weekly', url: 'https://www.shazam.com/charts/top-200/united-states', parser: parseShazamHtml },
  { id: 'aria-australia-weekly', name: 'ARIA Top 50 Singles', type: 'weekly', url: 'https://www.aria.com.au/charts/singles-chart', parser: parseAriaHtml },
  { id: 'official-uk-singles-weekly', name: 'Official UK Singles Top 100', type: 'weekly', url: 'https://www.officialcharts.com/charts/singles-chart/', parser: parseOfficialChartsHtml },
  { id: 'billboard-hot-100', name: 'Billboard Hot 100', type: 'weekly', url: 'https://www.billboard.com/charts/hot-100/', parser: parseBillboardHtml },
  { id: 'billboard-global-200', name: 'Billboard Global 200', type: 'weekly', url: 'https://www.billboard.com/charts/billboard-global-200/', parser: parseBillboardHtml },
];

function clean(value) { return String(value ?? '').replace(/\\s+/g, ' ').trim(); }
function stripHtml(value) { return clean(String(value ?? '').replace(/<[^>]+>/g, '')); }
function key(title, artists = []) { return `${clean(title).toLowerCase()}::${artists.map(clean).join('|').toLowerCase()}`; }
function csvRows(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if ((c === '\\n' || c === '\\r') && !quoted) { if (c === '\\r' && text[i + 1] === '\\n') i++; row.push(field); field = ''; if (row.some(v => clean(v))) rows.push(row); row = []; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); } return rows;
}
function parseSpotifyCsv(text) {
  const rows = csvRows(text); if (rows.length < 2) throw new Error('Spotify CSV contained no rows');
  const headers = rows[0].map(clean); const index = n => headers.findIndex(h => h.toLowerCase() === n);
  const rank=index('rank'), title=index('track_name'), artist=index('artist_names'), streams=index('streams'), date=index('date'), region=index('region');
  if (rank < 0 || title < 0 || artist < 0) throw new Error('Unexpected Spotify CSV schema');
  return rows.slice(1).map(r => ({ rank:Number(r[rank]), title:clean(r[title]), artists:clean(r[artist]).split(',').map(clean).filter(Boolean), streams:streams>=0 ? Number(r[streams])||null : null, chartDate:date>=0 ? clean(r[date]) : null, region:region>=0 ? clean(r[region]) : 'Global' })).filter(x => Number.isFinite(x.rank) && x.title);
}
function parseAppleRss(text) {
  const json = JSON.parse(text); const results = Array.isArray(json.feed?.results) ? json.feed.results : [];
  return results.map((item,i) => ({ rank:i+1, title:clean(item.name), artists:[clean(item.artistName)].filter(Boolean), album:clean(item.collectionName)||null, url:item.url||null, artworkUrl:item.artworkUrl100||null, chartDate:json.feed?.updated||null })).filter(x=>x.title);
}
function parseDeezerJson(text) {
  const json=JSON.parse(text); const rows=Array.isArray(json.data)?json.data:[];
  return rows.map((item,i)=>({rank:i+1,title:clean(item.title),artists:[clean(item.artist?.name)].filter(Boolean),album:clean(item.album?.title)||null,url:item.link||null,artworkUrl:item.album?.cover_medium||null})).filter(x=>x.title);
}
function parseYouTubeHtml(text) {
  const html=text.replace(/\\u003c/g,'<').replace(/\\u003e/g,'>').replace(/\\u0026/g,'&'); const out=[];
  const patterns=[
    /"rank"\\s*:\\s*(\\d+)[\\s\\S]{0,1200}?"title"\\s*:\\s*"([^"\\n]+)"[\\s\\S]{0,1200}?"artist"\\s*:\\s*"([^"\\n]+)"/gi,
    /data-rank=["'](\\d+)["'][\\s\\S]{0,1200}?(?:data-title|title)=["']([^"']+)["'][\\s\\S]{0,1200}?(?:data-artist|artist)=["']([^"']+)["']/gi
  ];
  for(const re of patterns){let m;while((m=re.exec(html))){const rank=Number(m[1]),title=stripHtml(m[2]),artist=stripHtml(m[3]);if(rank>0&&rank<=200&&title&&artist)out.push({rank,title,artists:[artist]});}if(out.length)break;}
  if(!out.length) throw new Error('YouTube Charts markup did not expose chart rows');
  return dedupeByRank(out);
}
function parseYouTubeArtistHtml(text) {
  const html=text.replace(/\\u003c/g,'<').replace(/\\u003e/g,'>').replace(/\\u0026/g,'&'); const out=[];
  const patterns=[
    /"rank"\\s*:\\s*(\\d+)[\\s\\S]{0,1200}?"artist"\\s*:\\s*"([^"\\n]+)"/gi,
    /data-rank=["'](\\d+)["'][\\s\\S]{0,1200}?(?:data-artist|artist)=["']([^"']+)["']/gi
  ];
  for(const re of patterns){let m;while((m=re.exec(html))){const rank=Number(m[1]),artist=stripHtml(m[2]);if(rank>0&&rank<=100&&artist)out.push({rank,title:artist,artists:[artist]});}if(out.length)break;}
  if(!out.length) throw new Error('YouTube artist chart markup did not expose rows');
  return dedupeByRank(out);
}
function parseShazamHtml(text) {
  const html=text.replace(/\\u003c/g,'<').replace(/\\u003e/g,'>'); const out=[];
  const patterns=[
    /(?:"rank"|data-rank)[^\\d]{0,20}(\\d+)[\\s\\S]{0,1500}?(?:"title"|data-title)[^"']*["']([^"']+)["'][\\s\\S]{0,1000}?(?:"artist"|data-artist)[^"']*["']([^"']+)["']/gi,
    /<a[^>]+href="[^"]*\/song\/[^"]+"[^>]*>([\\s\\S]{1,300}?)<\\/a>/gi
  ];
  for(const re of patterns){let m;while((m=re.exec(html))&&out.length<200){if(re===patterns[1]){const textValue=stripHtml(m[1]);const parts=textValue.split(/\\s{2,}|\\n+/).map(clean).filter(Boolean);if(parts.length>=2)out.push({rank:out.length+1,title:parts[0],artists:[parts[1]]});}else{const rank=Number(m[1]),title=stripHtml(m[2]),artist=stripHtml(m[3]);if(rank>0&&rank<=200&&title&&artist)out.push({rank,title,artists:[artist]});}}if(out.length)break;}
  if(!out.length) throw new Error('Shazam markup did not expose chart rows');
  return dedupeByRank(out);
}
function parseAriaHtml(text) {
  const normalized=text.replace(/<script[\\s\\S]*?<\\/script>/gi,' ').replace(/<style[\\s\\S]*?<\\/style>/gi,' ');
  const stripped=normalized.replace(/<[^>]+>/g,'\\n').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
  const lines=stripped.split(/\\n+/).map(clean).filter(Boolean), out=[];
  for(let i=0;i<lines.length&&out.length<50;i++){ if(!/^\\d+$/.test(lines[i]))continue; const rank=Number(lines[i]); if(rank<1||rank>50)continue; const title=lines[i+1],artist=lines[i+2]; if(!title||!artist||/^\\d+$/.test(title))continue; const next=lines.slice(i+3,i+9); out.push({rank,title,artists:artist.split(',').map(clean).filter(Boolean),lastWeek:next.find(v=>/last week/i.test(v))||null,peak:next.find(v=>/peak/i.test(v))||null,weeksInChart:next.find(v=>/weeks in/i.test(v))||null}); }
  return dedupeByRank(out);
}
function parseOfficialChartsHtml(text) {
  const normalized=text.replace(/<script[\\s\\S]*?<\\/script>/gi,' ').replace(/<style[\\s\\S]*?<\\/style>/gi,' ');
  const lines=normalized.replace(/<[^>]+>/g,'\\n').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').split(/\\n+/).map(clean).filter(Boolean); const out=[];
  for(let i=0;i<lines.length&&out.length<100;i++){if(!/^Number\\s*\\d+$/i.test(lines[i]))continue;const rank=Number(lines[i].match(/\\d+/)[0]);const title=lines[i+1],artist=lines[i+2];if(title&&artist)out.push({rank,title,artists:artist.split(/[\\/]/).map(clean).filter(Boolean)});}
  if(!out.length) throw new Error('Official Charts markup did not expose chart rows');
  return dedupeByRank(out);
}
function parseBillboardHtml(text) {
  const out=[]; const patterns=[/c-title[^>]*>([\\s\\S]*?)<\\/h3>[\\s\\S]*?c-label[^>]*>([\\s\\S]*?)<\\/span>/gi,/o-chart-results-list__item-title[^>]*>([\\s\\S]*?)<\\/h3>[\\s\\S]*?o-chart-results-list__item-excerpt[^>]*>([\\s\\S]*?)<\\/span>/gi];
  for(const re of patterns){let m;while((m=re.exec(text))&&out.length<200){const title=stripHtml(m[1]),artist=stripHtml(m[2]);if(title&&artist)out.push({rank:out.length+1,title,artists:[artist]});}if(out.length)break;} if(!out.length)throw new Error('Billboard markup did not expose chart rows');return out;
}
function dedupeByRank(rows){return [...new Map(rows.map(row=>[row.rank,row])).values()].sort((a,b)=>a.rank-b.rank);}
async function fetchSource(source){const response=await fetch(source.url,{headers:{'user-agent':'StrettoCharts/1.0 (+https://github.com/Tezzaaaaaa/StrettoCharts)',accept:'text/html,application/json,text/csv;q=0.9,*/*;q=0.8'}});if(!response.ok)throw new Error(`HTTP ${response.status}`);const entries=source.parser(await response.text());if(!entries.length)throw new Error('No chart entries parsed');return entries;}

function addMovement(current, previous){
  const previousByKey=new Map((previous?.entries||[]).map(e=>[key(e.title,e.artists),e]));
  return current.map(e=>{const old=previousByKey.get(key(e.title,e.artists));const movement=old?old.rank-e.rank:null;return {...e,previousRank:old?.rank??null,movement,movementLabel:movement===null?'new':movement>0?`up ${movement}`:movement<0?`down ${Math.abs(movement)}`:'same',peakRank:Math.min(e.rank,old?.peakRank??e.rank),weeksOnChart:(old?.weeksOnChart||0)+1};});
}
function calculateArtistRankings(sources){
  const map=new Map();
  for(const source of sources){for(const entry of source.entries||[]){for(const artist of entry.artists||[]){const name=clean(artist);if(!name)continue;const id=name.toLowerCase();const row=map.get(id)||{artist:name,appearances:0,totalPoints:0,bestRank:null,charts:0};row.appearances++;row.totalPoints+=Math.max(0,101-entry.rank);row.bestRank=row.bestRank===null?entry.rank:Math.min(row.bestRank,entry.rank);row.charts++;map.set(id,row);}}}
  return [...map.values()].sort((a,b)=>b.totalPoints-a.totalPoints||b.appearances-a.appearances||a.bestRank-b.bestRank).map((x,i)=>({...x,rank:i+1}));
}

async function main(){
  await mkdir(DATA_DIR,{recursive:true}); await mkdir(HISTORY_DIR,{recursive:true}); const now=new Date(); const updatedAt=now.toISOString();
  let previous=null; try{previous=JSON.parse(await readFile(LATEST,'utf8'));}catch{}
  const results=await Promise.all(SOURCES.map(async source=>{try{const raw=await fetchSource(source);const old=previous?.sources?.find(s=>s.id===source.id);const entries=addMovement(raw,old);return{id:source.id,name:source.name,type:source.type,sourceUrl:source.url,status:'ok',fetchedAt:updatedAt,count:entries.length,entries};}catch(error){return{id:source.id,name:source.name,type:source.type,sourceUrl:source.url,status:'error',fetchedAt:updatedAt,count:0,error:error instanceof Error?error.message:String(error),entries:[]};}}));
  const ok=results.filter(x=>x.status==='ok'); const artistRankings=calculateArtistRankings(ok); const payload={schemaVersion:3,generatedAt:updatedAt,sources:results,artistRankings};
  await writeFile(LATEST,JSON.stringify(payload,null,2)+'\\n','utf8');
  if(ok.length){const date=updatedAt.slice(0,10);await writeFile(new URL(`./${date}.json`,HISTORY_DIR),JSON.stringify(payload,null,2)+'\\n','utf8');let index=[];try{index=JSON.parse(await readFile(HISTORY_INDEX,'utf8'));}catch{}if(!index.some(x=>x.date===date))index.push({date,file:`${date}.json`,generatedAt:updatedAt,sources:ok.map(x=>x.id)});index.sort((a,b)=>b.date.localeCompare(a.date));await writeFile(HISTORY_INDEX,JSON.stringify(index,null,2)+'\\n','utf8');}
  console.log(`StrettoCharts updated: ${ok.length}/${results.length} sources succeeded; ${artistRankings.length} artists ranked`);for(const r of results)console.log(`${r.status.toUpperCase()} ${r.id}: ${r.count}`);if(!ok.length)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
