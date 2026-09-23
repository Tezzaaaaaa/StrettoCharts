import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const searchSource=await readFile(new URL('../search-enhancements.js',import.meta.url),'utf8');
const spotifySource=await readFile(new URL('../spotify-tracking.js',import.meta.url),'utf8');
const listeners=new Map(),observers=[];
let candidate=null,profileVisible=false,profilePanel=null,profileName=null;
function el(id=''){
  const x={id,value:'',textContent:'',dataset:{},isConnected:true,parent:null,
    addEventListener(t,f){listeners.set(t,f)},dispatchEvent(e){listeners.get(e.type)?.(e)},
    setAttribute(n,v){this[n]=v},appendChild(){},prepend(){},
    querySelector(s){if(s==='img'||s==='#backSearch')return null;if(s==='.profile')return profileVisible?profile:null;if(s==='.profile-name')return profileName;return null},
    querySelectorAll(s){return s==='.candidate'&&candidate?[candidate]:[]}
  };
  let html='';
  Object.defineProperty(x,'innerHTML',{get(){return html},set(v){html=String(v);if(id==='results'){profileVisible=html.includes('class="profile"');candidate=html.includes('class="candidate"')?el('candidate'):null;if(candidate)candidate.dataset={kind:'Artist',name:'Lady Gaga',artist:'Lady Gaga'}}if(id==='spotifyArtistPanel')profilePanel=x;notify(x)}});
  x.after=n=>{profilePanel=n;notify(x)};return x;
}
function notify(target){for(const o of observers)if(o.target===target||o.subtree)o.cb()}
const results=el('results'),wrap=el('results-wrap'),profile=el('profile');profileName=el('profile-name');profileName.textContent='Lady Gaga';
const back=el('backSearch');profile.querySelector=s=>s==='.profile-name'?profileName:s==='#backSearch'?back:null;
const map={'#searchForm':el('searchForm'),'#search':el('search'),'#results':results,'#title':el('title'),'#sub':el('sub'),'#count':el('count'),'#updated':el('updated'),'.results-wrap':wrap};
const document={head:el('head'),createElement:()=>el(),querySelector:s=>map[s]||null,querySelectorAll:()=>[]};
const context={console,document,location:{href:'https://strettocharts.test/'},URL,setTimeout,clearTimeout,
  MutationObserver:class{constructor(cb){this.cb=cb}observe(target,o){this.target=target;this.subtree=Boolean(o?.subtree);observers.push(this)}},
  fetch:async url=>{
    if(url==='data/latest.json')return{ok:true,json:async()=>({schemaVersion:3,generatedAt:'2026-09-23T00:00:00.000Z',sources:[{id:'test',name:'Test Chart',status:'ok',entries:[{rank:1,previousRank:1,peakRank:1,weeksOnChart:2,title:'Die With A Smile',artists:['Lady Gaga']}]}]})};
    if(url==='data/spotify-artists.json')return{ok:true,json:async()=>({generatedAt:'2026-09-23',artists:[{name:'Lady Gaga',monthlyListeners:1}]})};
    if(url==='data/following.json')return{ok:true,json:async()=>[{name:'Lady Gaga',spotifyArtistId:'1HY2Jd0NmPuamShAr6KMms'}]};
    throw new Error('Unexpected fetch URL: '+url);
  }};
vm.runInNewContext(spotifySource,context);vm.runInNewContext(searchSource,context);
await new Promise(r=>setTimeout(r,0));
const form=map['#searchForm'],input=map['#search'];input.value='Lady Gaga';form.dispatchEvent({type:'submit',preventDefault(){}});await new Promise(r=>setTimeout(r,0));
if(!candidate)throw new Error('search result candidate was not rendered');
candidate.dispatchEvent({type:'click'});await new Promise(r=>setTimeout(r,0));
if(!profileVisible||!results.innerHTML.includes('class="profile"'))throw new Error('click did not replace #results with the profile');
console.log('Search click test passed: clicking a .candidate replaces #results with the profile.');
