import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../spotify-tracking.js',import.meta.url),'utf8');
function el(id=''){const x={id,value:'',textContent:'',className:'',prepend(){},appendChild(){},setAttribute(){},addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}};let html='';Object.defineProperty(x,'innerHTML',{configurable:true,get(){return html},set(v){html=String(v)}});return x}
const results=el('results'),wrap=el('results-wrap'),profile=el('profile'),name=el('profile-name');name.textContent='Lady Gaga';
profile.querySelector=s=>s==='.profile-name'?name:null;profile.after=n=>{panel=n;map['#spotifyArtistPanel']=n};
results.querySelector=s=>s==='.profile'?profile:s==='#spotifyArtistPanel'?panel:null;
let panel=null;
const map={'#results':results,'.results-wrap':wrap,'#search':el('search'),'#searchForm':el('searchForm')};
const document={head:el('head'),createElement:()=>{const x=el();const old=x.innerHTML;Object.defineProperty(x,'innerHTML',{get(){return x._html||''},set(v){x._html=String(v)}});return x},querySelector:s=>map[s]||null,querySelectorAll:()=>[]};
const context={console,document,fetch:async url=>{
 if(url==='data/spotify-artists.json')return{ok:true,json:async()=>({generatedAt:'2026-09-23',artists:[{name:'Lady Gaga',monthlyListeners:100000000,dailyStreams:1000000,totalStreams:1000000000,tracks:377,monthlyListenersPeak:120000000,monthlyListenersDailyChange:1000,topSongs:[],topAlbums:[]}]})};
 if(url==='data/following.json')return{ok:true,json:async()=>[{name:'Lady Gaga',spotifyArtistId:'1HY2Jd0NmPuamShAr6KMms'}]};
 throw new Error('Unexpected fetch URL: '+url)},localStorage:{getItem(){return null},setItem(){}},MutationObserver:class{observe(){}},Intl,Event,URL};
wrap.prepend=function(x){map['#artistWatch']=x};
const originalCreate=document.createElement;document.createElement=()=>{const x=originalCreate();const setter=Object.getOwnPropertyDescriptor(x,'innerHTML').set;Object.defineProperty(x,'innerHTML',{get(){return x._html||''},set(v){x._html=String(v)}});x.after=n=>{panel=n;map['#spotifyArtistPanel']=n};return x};
vm.runInNewContext(source,context);
await new Promise(r=>setTimeout(r,0));
if(!map['#artistWatch']||!map['#artistWatch'].innerHTML.includes('Lady Gaga'))throw new Error('following.json did not render Lady Gaga');
if(!map['#spotifyArtistPanel']||!map['#spotifyArtistPanel'].innerHTML.includes('Spotify artist tracking'))throw new Error('Spotify tracking panel was not rendered');
console.log('Spotify tracking test passed: following.json renders Lady Gaga and the tracking panel.');
