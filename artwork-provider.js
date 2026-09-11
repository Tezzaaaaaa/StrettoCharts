/* StrettoCharts artwork provider: Deezer first, existing Apple/iTunes lookup second. */
(function(){
'use strict';
const nativeFetch=window.fetch.bind(window);
const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const originalUrl=window.fetch;
const timeout=(promise,ms)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error('artwork lookup timeout')),ms))]);
async function deezerResponse(url){
 const u=new URL(url,location.href),term=u.searchParams.get('term')||'',entity=u.searchParams.get('entity')||'song';
 if(!u.hostname.includes('itunes.apple.com')||u.pathname!=='/search')return null;
 const q=decodeURIComponent(term.replace(/\+/g,' ')).trim();
 if(!q)return null;
 const endpoint=entity==='album'?'album':'track';
 const r=await timeout(nativeFetch(`https://api.deezer.com/search/${endpoint}?q=${encodeURIComponent(q)}&limit=8`),1200);
 if(!r.ok)throw Error('Deezer artwork lookup failed');
 const j=await r.json(),wanted=norm(q.split(/\s+/)[0]);
 const results=(j.data||[]).map(x=>entity==='album'?{
   collectionName:x.title||'',artistName:x.artist?.name||'',artworkUrl100:x.cover_xl||x.cover_big||x.cover_medium||''
 }:{
   trackName:x.title||'',artistName:x.artist?.name||'',collectionName:x.album?.title||'',artworkUrl100:x.album?.cover_xl||x.album?.cover_big||x.album?.cover_medium||''
 });
 if(!results.length)return null;
 return new Response(JSON.stringify({results}),{status:200,headers:{'Content-Type':'application/json'}});
}
window.fetch=async function(input,init){
 const url=typeof input==='string'?input:input?.url||'';
 if(url.includes('itunes.apple.com/search')){
   try{
     const fast=await deezerResponse(url);
     if(fast)return fast;
   }catch(e){console.warn('Deezer artwork lookup unavailable; using Apple fallback:',e)}
   return originalUrl(input,init);
 }
 return originalUrl(input,init);
};
})();
