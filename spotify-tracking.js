(function(){
'use strict';
var d=document, $=function(s){return d.querySelector(s);};
var storageKey='strettocharts-following', following=[], stats=null, catalog=null;
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c;});}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function fmt(n){return Number.isFinite(Number(n))?new Intl.NumberFormat('en-AU').format(Number(n)):'—';}
function compact(n){return Number.isFinite(Number(n))?new Intl.NumberFormat('en-AU',{notation:'compact',maximumFractionDigits:1}).format(Number(n)):'—';}
function readLocal(){try{var r=localStorage.getItem(storageKey);if(r){var p=JSON.parse(r);if(Array.isArray(p))return p;}}catch(e){}return null;}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(following));}catch(e){}}
function isFollowing(name){return following.some(function(x){return norm(x.name)===norm(name);});}
function artistData(name){return (stats&&stats.artists||[]).find(function(x){return norm(x.name)===norm(name);});}
function toggle(name,id){var i=following.findIndex(function(x){return norm(x.name)===norm(name);});if(i>=0)following.splice(i,1);else following.push({name:name,id:id||''});save();renderWatch();refreshProfileButton();renderArtistWatch();}
function style(){
 if($('#stretto-spotify-css'))return;
 var s=d.createElement('style');s.id='stretto-spotify-css';
 s.textContent='.artist-watch{margin:24px 0 12px}.watch-head{display:flex;justify-content:space-between;align-items:end;margin:0 2px 10px}.watch-head h2{margin:0;font-size:20px;letter-spacing:-.03em}.watch-head p{margin:3px 0 0;color:var(--muted);font-size:11px}.watch-empty{padding:15px 17px;border-radius:17px;background:var(--panel);border:1px dashed var(--line);color:var(--muted);font-size:11px}.watch-list{display:flex;gap:9px;overflow:auto;padding-bottom:3px}.watch-chip{display:flex;align-items:center;gap:9px;flex:0 0 auto;padding:9px 11px;border:1px solid var(--line);background:var(--panel);border-radius:14px;cursor:pointer;color:inherit}.watch-chip:hover{border-color:#7657ff}.watch-chip strong{font-size:11px}.watch-chip span{display:block;color:var(--muted);font-size:9px}.follow-btn{border:1px solid currentColor;background:#ffffff14;color:inherit;border-radius:999px;padding:8px 12px;font-size:10px;font-weight:800;cursor:pointer}.follow-btn.following{background:#fff;color:#17171c}.spotify-panel{margin-top:12px;padding:19px;border-radius:21px;background:var(--panel);border:1px solid var(--line);box-shadow:0 7px 24px #24243b0a}.spotify-panel h3{margin:0;font-size:17px}.spotify-source{margin:4px 0 12px;color:var(--muted);font-size:9px}.spotify-metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.spotify-metric{padding:11px;border-radius:14px;background:var(--soft)}.spotify-metric strong{display:block;font-size:18px}.spotify-metric span{font-size:8px;color:var(--muted)}.spotify-tables{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.spotify-table{padding:13px;border-radius:16px;background:var(--soft)}.spotify-table h4{margin:0 0 8px;font-size:12px}.spotify-row{display:grid;grid-template-columns:22px 1fr auto;gap:7px;padding:7px 0;border-bottom:1px solid var(--line);font-size:10px}.spotify-row:last-child{border-bottom:0}.spotify-row small{color:var(--muted)}.spotify-foot{margin-top:10px;color:var(--muted);font-size:9px;line-height:1.5}.spotify-missing{padding:14px;border-radius:14px;background:var(--soft);color:var(--muted);font-size:10px}@media(max-width:700px){.spotify-metrics{grid-template-columns:1fr 1fr}.spotify-tables{grid-template-columns:1fr}.watch-head{display:block}.watch-head p{margin-top:4px}}';
 d.head.appendChild(s);
}
function renderWatch(){
 var host=$('#artistWatch');
 if(!host){host=d.createElement('section');host.id='artistWatch';host.className='artist-watch';var wrap=$('.results-wrap');if(wrap)wrap.prepend(host);}
 var html='<div class="watch-head"><div><h2>Following</h2><p>Track artists without needing a Spotify account.</p></div></div>';
 if(following.length){
   html+='<div class="watch-list">'+following.map(function(x){var a=artistData(x.name);return '<button class="watch-chip" type="button" data-watch="'+esc(x.name)+'"><strong>'+esc(x.name)+'</strong><span>'+(a&&a.dailyStreams?compact(a.dailyStreams)+' daily streams':'')+'</span></button>';}).join('')+'</div>';
 }else html+='<div class="watch-empty">Follow an artist from their StrettoCharts profile. Lady Gaga is preloaded as the initial watchlist artist.</div>';
 host.innerHTML=html;
 host.querySelectorAll('[data-watch]').forEach(function(b){b.addEventListener('click',function(){focusArtist(b.dataset.watch);});});
}
function focusArtist(name){var input=$('#search');if(!input)return;input.value=name;var form=$('#searchForm');if(form)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}
function refreshProfileButton(){
 var profile=$('.profile');if(!profile)return;var name=profile.querySelector('.profile-name');if(!name)return;name=name.textContent.trim();
 var button=profile.querySelector('.follow-btn');if(!button){button=d.createElement('button');button.className='follow-btn';button.type='button';var actions=profile.querySelector('.profile-actions');if(actions)actions.before(button);}
 var f=isFollowing(name);button.textContent=f?'Following':'Follow artist';button.classList.toggle('following',f);button.onclick=function(){var a=artistData(name);toggle(name,a&&a.spotifyArtistId||'');};
}
function renderArtistWatch(){
 var profile=$('.profile');if(!profile)return;var name=profile.querySelector('.profile-name');if(!name)return;name=name.textContent.trim();
 var data=artistData(name), panel=$('#spotifyArtistPanel');
 if(!panel){panel=d.createElement('section');panel.id='spotifyArtistPanel';panel.className='spotify-panel';profile.after(panel);}
 if(!data){panel.innerHTML='<h3>Spotify-style artist tracking</h3><div class="spotify-source">StrettoCharts tracking layer</div><div class="spotify-missing">This artist is followed locally, but no streaming snapshot is available yet. Chart positions can still be tracked from the StrettoCharts dataset.</div>';return;}
 var metrics=[['Monthly listeners',compact(data.monthlyListeners)],['Daily streams',compact(data.dailyStreams)],['Total streams',compact(data.totalStreams)],['Tracks',fmt(data.tracks)],['Listener peak',compact(data.monthlyListenersPeak)]];
 var html='<h3>Spotify artist tracking</h3><div class="spotify-source">Public Spotify statistics via Kworb; not Spotify for Artists. Snapshot: '+esc(String(stats&&stats.generatedAt||'').slice(0,10))+(data.stale?' · last successful snapshot retained':'')+'</div>';
 html+='<div class="spotify-metrics">'+metrics.map(function(x){return '<div class="spotify-metric"><strong>'+esc(x[1])+'</strong><span>'+esc(x[0])+'</span></div>';}).join('')+'</div>';
 var change=Number(data.monthlyListenersDailyChange);html+='<div class="spotify-foot">'+(change>0?'Monthly listeners: +'+fmt(change)+' since the previous tracker update.':change<0?'Monthly listeners: '+fmt(change)+' since the previous tracker update.':'Monthly-listener daily change unavailable.')+'</div>';
 html+='<div class="spotify-tables"><div class="spotify-table"><h4>Top songs by streams</h4>';
 html+=(data.topSongs||[]).slice(0,10).map(function(x,i){return '<div class="spotify-row"><b>'+(i+1)+'</b><span>'+esc(x.title)+'</span><small>'+compact(x.streams)+'</small></div>';}).join('');
 html+='</div><div class="spotify-table"><h4>Top albums by streams</h4>';
 html+=(data.topAlbums||[]).slice(0,10).map(function(x,i){return '<div class="spotify-row"><b>'+(i+1)+'</b><span>'+esc(x.title)+'</span><small>'+compact(x.streams)+'</small></div>';}).join('');
 html+='</div></div>';panel.innerHTML=html;
}
function observe(){var target=$('#results');if(!target)return;new MutationObserver(function(){refreshProfileButton();renderArtistWatch();}).observe(target,{childList:true,subtree:true});}
async function init(){
 style();
 try{var r=await fetch('data/spotify-artists.json',{cache:'no-store'});if(r.ok)stats=await r.json();}catch(e){}
 try{var r2=await fetch('data/following.json',{cache:'no-store'});if(r2.ok)catalog=await r2.json();}catch(e){}
 following=readLocal();if(!following&&Array.isArray(catalog))following=catalog.slice();if(!following)following=[];
 renderWatch();observe();
}
init();
window.strettoSpotify={toggle:toggle,focusArtist:focusArtist};
})();