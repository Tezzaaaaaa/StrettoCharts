/* StrettoCharts artwork provider: Deezer first, existing Apple/iTunes lookup second. */
(function(){
'use strict';
const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const timeout=(promise,ms)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error('artwork lookup timeout')),ms))]);
async function deezerArtwork(c){
 const q=[c.name,c.artist].filter(Boolean).join(' '),wanted=norm(c.name),artist=norm(c.artist||'');
 if(!q)return '';
 const endpoint=c.kind==='Song'?'track':'album';
 const r=await timeout(fetch(`https://api.deezer.com/search/${endpoint}?q=${encodeURIComponent(q)}&limit=8`),1200);
 if(!r.ok)throw Error('Deezer artwork lookup failed');
 const j=await r.json(),rows=j.data||[];
 const match=rows.find(x=>norm(x.title)===wanted&&(!artist||norm(x.artist?.name||'')===artist));
 if(match)return match.cover_xl||match.cover_big||match.cover_medium||'';
 if(c.kind==='Artist'){
   const artistMatch=rows.find(x=>norm(x.artist?.name||'')===wanted);
   if(artistMatch)return artistMatch.cover_xl||artistMatch.cover_big||artistMatch.cover_medium||'';
 }
 return '';
}
async function appleArtwork(c){
 const term=encodeURIComponent([c.name,c.artist].filter(Boolean).join(' '));
 const entity=c.kind==='Album'?'album':'song';
 const r=await timeout(fetch(`https://itunes.apple.com/search?term=${term}&entity=${entity}&limit=8&country=AU`),1800);
 if(!r.ok)throw Error('Apple artwork lookup failed');
 const j=await r.json(),wanted=norm(c.name),artist=norm(c.artist||'');
 let m=(j.results||[]).find(x=>norm(c.kind==='Album'?x.collectionName:x.trackName)===wanted&&(!artist||norm(x.artistName)===artist)&&x.artworkUrl100);
 if(!m&&c.kind==='Artist')m=(j.results||[]).find(x=>norm(x.artistName)===wanted&&x.artworkUrl100);
 if(!m&&c.kind==='Artist'){
   const r2=await timeout(fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(c.name)}&entity=album&limit=8&country=AU`),1800);
   if(r2.ok){const j2=await r2.json();m=(j2.results||[]).find(x=>norm(x.artistName)===wanted&&x.artworkUrl100)}
 }
 return m?.artworkUrl100?.replace(/100x100/g,'1200x1200')||'';
}
window.strettoArtwork=async function(c){
 try{const url=await deezerArtwork(c);if(url)return url}catch(e){console.warn('Deezer artwork lookup unavailable; using Apple fallback:',e)}
 try{return await appleArtwork(c)}catch(e){console.warn('Apple artwork lookup unavailable:',e);return ''}
};
})();
