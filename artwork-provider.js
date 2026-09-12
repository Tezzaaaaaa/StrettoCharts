/* StrettoCharts artwork provider: explicit Deezer-first lookup with Apple/iTunes fallback. */
(function(){
'use strict';
const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const cache=new Map();
const timeout=(promise,ms)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error('artwork lookup timeout')),ms))]);
const cover=x=>x?.cover_xl||x?.cover_big||x?.cover_medium||'';
const artistArt=x=>x?.picture_xl||x?.picture_big||x?.picture_medium||'';
const appleArt=x=>x?.artworkUrl100?.replace(/100x100/g,'1200x1200')||'';
async function deezer(kind,name,artist){
 const query=[name,artist].filter(Boolean).join(' ').trim();
 if(!query)return '';
 const endpoint=kind==='Album'?'album':kind==='Artist'?'artist':'track';
 const r=await timeout(fetch(`https://api.deezer.com/search/${endpoint}?q=${encodeURIComponent(query)}&limit=8`),1200);
 if(!r.ok)throw Error('Deezer artwork lookup failed');
 const data=(await r.json()).data||[], wanted=norm(name),wantedArtist=norm(artist);
 if(kind==='Artist'){
   const match=data.find(x=>norm(x.name)===wanted&&artistArt(x));
   return match?artistArt(match):'';
 }
 const match=data.find(x=>{
   const title=norm(x.title),by=norm(x.artist?.name);
   return title===wanted&&(!wantedArtist||by===wantedArtist)&&cover(x.album||x);
 });
 if(match)return cover(kind==='Album'?match:match.album);
 const fallback=data.find(x=>cover(kind==='Album'?x:x.album)&&(!wantedArtist||norm(x.artist?.name)===wantedArtist));
 return fallback?cover(kind==='Album'?fallback:fallback.album):'';
}
async function apple(kind,name,artist){
 const entity=kind==='Album'?'album':'song';
 const query=[name,artist].filter(Boolean).join(' ');
 const r=await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=8&country=AU`);
 if(!r.ok)throw Error('Apple artwork lookup failed');
 const wanted=norm(name),wantedArtist=norm(artist),results=(await r.json()).results||[];
 const match=results.find(x=>norm(kind==='Album'?x.collectionName:x.trackName)===wanted&&(!wantedArtist||norm(x.artistName)===wantedArtist)&&x.artworkUrl100);
 return match?appleArt(match):'';
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
