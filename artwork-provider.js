/* StrettoCharts artwork provider: explicit Deezer-first lookup with Apple/iTunes fallback. */
(function(){
'use strict';
const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const cache=new Map();
const timeout=async(promise,ms)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error('artwork lookup timeout')),ms))]);
const artwork=x=>x?.cover_xl||x?.cover_big||x?.cover_medium||x?.artworkUrl100?.replace(/100x100/g,'1200x1200')||'';
async function deezer(kind,name,artist){
 const query=[name,artist].filter(Boolean).join(' ').trim();
 if(!query)return '';
 const endpoint=kind==='Album'?'album':kind==='Artist'?'artist':'track';
 const r=await timeout(fetch(`https://api.deezer.com/search/${endpoint}?q=${encodeURIComponent(query)}&limit=8`),1200);
 if(!r.ok)throw Error('Deezer artwork lookup failed');
 const data=(await r.json()).data||[], wanted=norm(name),wantedArtist=norm(artist);
 const match=data.find(x=>{
   const title=norm(kind==='Album'?x.title:kind==='Artist'?x.name:x.title);
   const by=norm(kind==='Artist'?x.name:x.artist?.name);
   return artwork(kind==='Artist'?x:{cover_xl:x.album?.cover_xl,cover_big:x.album?.cover_big,cover_medium:x.album?.cover_medium})&&title===wanted&&(!wantedArtist||by===wantedArtist);
 });
 if(match)return artwork(kind==='Artist'?match:match);
 const fallback=data.find(x=>artwork(kind==='Artist'?x:x.album) && (!wantedArtist||norm(x.artist?.name)===wantedArtist));
 return fallback?artwork(kind==='Artist'?fallback:fallback.album):'';
}
async function apple(kind,name,artist){
 const entity=kind==='Album'?'album':'song';
 const query=[name,artist].filter(Boolean).join(' ');
 const r=await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=8&country=AU`);
 if(!r.ok)throw Error('Apple artwork lookup failed');
 const wanted=norm(name),wantedArtist=norm(artist),results=(await r.json()).results||[];
 const match=results.find(x=>norm(kind==='Album'?x.collectionName:x.trackName)===wanted&&(!wantedArtist||norm(x.artistName)===wantedArtist)&&x.artworkUrl100);
 return match?.artworkUrl100?.replace(/100x100/g,'1200x1200')||'';
}
window.strettoArtwork=async function(kind,name,artist){
 const key=`${kind}|${norm(name)}|${norm(artist)}`;
 if(cache.has(key))return cache.get(key);
 let url='';
 try{url=await deezer(kind,name,artist)}catch(e){console.warn('Deezer artwork unavailable; using Apple fallback.',e)}
 if(!url){try{url=await apple(kind,name,artist)}catch(e){console.warn('Apple artwork unavailable.',e)}}
 cache.set(key,url);
 return url;
};
})();
