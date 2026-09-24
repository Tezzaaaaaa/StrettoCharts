/* StrettoCharts artist hub: following strip + full artist page with
   discography, career stats, chart footprint and streaming data. */
(function(){
'use strict';
var d=document,$=function(s){return d.querySelector(s);};
var storageKey='strettocharts-following',following=[],stats=null,catalog=null,chartData=null,discogCache={};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c;});}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function fmt(n){return Number.isFinite(Number(n))?new Intl.NumberFormat('en-AU').format(Number(n)):'—';}
function compact(n){return Number.isFinite(Number(n))?new Intl.NumberFormat('en-AU',{notation:'compact',maximumFractionDigits:1}).format(Number(n)):'—';}
function readLocal(){try{var r=localStorage.getItem(storageKey);if(r){var p=JSON.parse(r);if(Array.isArray(p))return p;}}catch(e){}return null;}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(following));}catch(e){}}
function isFollowing(name){return following.some(function(x){return norm(x.name)===norm(name);});}
function artistData(name){return (stats&&stats.artists||[]).find(function(x){return norm(x.name)===norm(name);});}
function toggle(name,id){var i=following.findIndex(function(x){return norm(x.name)===norm(name);});if(i>=0)following.splice(i,1);else following.push({name:name,id:id||''});save();renderWatch();refreshProfileButton();renderArtistHub();}

/* ---------- Shared styles ---------- */
function style(){
 if($('#stretto-spotify-css'))return;
 var s=d.createElement('style');s.id='stretto-spotify-css';
 s.textContent=`
.artist-watch{margin:24px 0 12px}
.watch-head{display:flex;justify-content:space-between;align-items:end;margin:0 4px 12px}
.watch-head h2{margin:0;font-size:20px;letter-spacing:-.03em}
.watch-head p{margin:4px 0 0;color:var(--muted);font-size:11.5px}
.watch-empty{padding:16px 18px;border-radius:16px;background:var(--panel);border:1px dashed var(--line);color:var(--muted);font-size:12px}
.watch-list{display:flex;gap:10px;overflow:auto;padding:2px 2px 6px}
.watch-chip{display:flex;align-items:center;gap:10px;flex:0 0 auto;padding:10px 14px;border:1px solid var(--line);background:var(--panel);border-radius:14px;cursor:pointer;color:inherit;transition:border-color .15s,transform .15s}
.watch-chip:hover{border-color:#7657ff;transform:translateY(-1px)}
.watch-chip strong{font-size:12px}
.watch-chip span{display:block;color:var(--muted);font-size:10px;margin-top:1px}
.follow-btn{border:1px solid currentColor;background:#ffffff14;color:inherit;border-radius:999px;padding:8px 14px;font-size:11px;font-weight:800;cursor:pointer;transition:background .15s}
.follow-btn:hover{background:#ffffff22}
.follow-btn.following{background:#fff;color:#17171c;border-color:transparent}

/* Artist hub */
.artist-hub{margin-top:16px;display:flex;flex-direction:column;gap:16px}
.hub-panel{border-radius:22px;padding:22px;background:var(--panel);border:1px solid var(--line);box-shadow:0 8px 28px #24243b0a}
.hub-hero{display:grid;grid-template-columns:120px minmax(0,1fr);gap:20px;align-items:center;background:linear-gradient(135deg,#1a1230,#3b1f5c 60%,#7a2d7a);color:#fff;border:0}
.hub-photo{position:relative;width:120px;height:120px;border-radius:20px;overflow:hidden;background:#ffffff16;box-shadow:0 12px 30px #00000040}
.hub-photo img{width:100%;height:100%;object-fit:cover;display:block}
.hub-photo .fallback{position:absolute;inset:0;display:grid;place-items:center;font-size:44px;font-weight:900;background:linear-gradient(135deg,#ffffff2a,#ffffff0d);color:#ffffffcc}
.hub-info{min-width:0}
.hub-label{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#d5c9f0}
.hub-name{margin:6px 0 8px;font-size:clamp(26px,4vw,40px);font-weight:900;letter-spacing:-.045em;line-height:1.05}
.hub-summary{margin:0;color:#ddd4ef;font-size:13px;line-height:1.5;max-width:60ch}
.hub-quick{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:16px}
.hub-quick > div{padding:11px 12px;border-radius:12px;background:#ffffff10;border:1px solid #ffffff1a}
.hub-quick b{display:block;font-size:19px;font-weight:800;letter-spacing:-.02em}
.hub-quick span{font-size:9.5px;color:#d5cbe8;letter-spacing:.04em;text-transform:uppercase;margin-top:2px;display:block}

.hub-section{display:flex;flex-direction:column;gap:14px}
.hub-section h3{margin:0;font-size:16px;font-weight:800;letter-spacing:-.02em;display:flex;align-items:center;justify-content:space-between;gap:10px}
.hub-section h3 small{font-size:11px;font-weight:600;color:var(--muted)}

.discog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.discog-card{border-radius:16px;overflow:hidden;background:var(--soft);border:1px solid var(--line);display:flex;flex-direction:column;text-decoration:none;color:inherit;transition:transform .15s,border-color .15s}
.discog-card:hover{transform:translateY(-2px);border-color:#7657ff}
.discog-art{position:relative;aspect-ratio:1;width:100%;background:#eef0f4;overflow:hidden}
.discog-art img{width:100%;height:100%;object-fit:cover;display:block}
.discog-art .fallback{position:absolute;inset:0;display:grid;place-items:center;font-size:32px;font-weight:900;background:linear-gradient(135deg,#e6e8f0,#cfd3df);color:#5b5f72}
.discog-meta{padding:10px 12px 12px;display:flex;flex-direction:column;gap:4px}
.discog-title{font-size:12.5px;font-weight:700;line-height:1.3;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.discog-sub{font-size:10.5px;color:var(--muted);display:flex;justify-content:space-between;gap:6px}
.discog-badge{display:inline-block;padding:2px 6px;border-radius:5px;background:#eeeafc;color:#5744a8;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;width:max-content}

.hub-cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.hub-list{display:flex;flex-direction:column;gap:6px}
.hub-row{display:grid;grid-template-columns:26px minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font-size:12.5px}
.hub-row:last-child{border-bottom:0}
.hub-row .idx{font-weight:800;color:var(--muted);font-variant-numeric:tabular-nums;font-size:11px}
.hub-row .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hub-row .v{font-variant-numeric:tabular-nums;font-weight:700}
.hub-row .v small{display:block;color:var(--muted);font-size:10px;font-weight:600}
.hub-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}
.hub-metric{padding:13px;border-radius:14px;background:var(--soft)}
.hub-metric strong{display:block;font-size:19px;font-weight:800;letter-spacing:-.02em}
.hub-metric span{font-size:10px;color:var(--muted);letter-spacing:.03em;text-transform:uppercase;margin-top:3px;display:block}

.chart-footprint{display:flex;flex-direction:column;gap:7px}
.chart-footprint .cf-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:12px;align-items:center;padding:10px 12px;border-radius:12px;background:var(--soft);font-size:12px}
.chart-footprint .cf-source{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chart-footprint .cf-rank{font-weight:800;font-variant-numeric:tabular-nums}
.chart-footprint .cf-peak,.chart-footprint .cf-weeks{font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}

.details{margin-top:4px;border:1px solid var(--line);border-radius:16px;background:var(--soft);overflow:hidden}
.details>summary{cursor:pointer;padding:13px 16px;font-size:12.5px;font-weight:800;list-style:none;display:flex;justify-content:space-between;gap:10px}
.details>summary::-webkit-details-marker{display:none}
.details>summary::after{content:"+";color:var(--muted);font-weight:700}
.details[open]>summary::after{content:"−"}
.table-scroll{overflow:auto;max-height:520px;border-top:1px solid var(--line)}
.full-table{border-collapse:collapse;width:max-content;min-width:100%;font-size:11px}
.full-table th,.full-table td{padding:8px 12px;border-bottom:1px solid var(--line);white-space:nowrap;text-align:left}
.full-table th{position:sticky;top:0;background:var(--panel);font-weight:800;z-index:1}
.full-table td.num,.full-table th.num{text-align:right;font-variant-numeric:tabular-nums}
.full-table tr:last-child td{border-bottom:0}
.empty-note{padding:14px 16px;color:var(--muted);font-size:12px;text-align:center}

@media(max-width:800px){
  .hub-hero{grid-template-columns:88px minmax(0,1fr);gap:16px;padding:18px}
  .hub-photo{width:88px;height:88px;border-radius:16px}
  .hub-photo .fallback{font-size:34px}
  .hub-name{font-size:24px}
  .hub-cols{grid-template-columns:1fr}
  .chart-footprint .cf-row{grid-template-columns:minmax(0,1fr) auto;gap:8px}
  .chart-footprint .cf-peak,.chart-footprint .cf-weeks{grid-column:auto;font-size:10px}
  .discog-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}
}
html[data-theme="dark"] .hub-panel{box-shadow:0 8px 28px #0005}
html[data-theme="dark"] .discog-card{background:#23232c}
html[data-theme="dark"] .discog-art{background:#2b2b34}
html[data-theme="dark"] .discog-art .fallback{background:linear-gradient(135deg,#33334a,#1f1f2c);color:#b0b3c4}
html[data-theme="dark"] .discog-badge{background:#2a2442;color:#d6d0ff}
html[data-theme="dark"] .hub-metric,html[data-theme="dark"] .chart-footprint .cf-row,html[data-theme="dark"] .details{background:#23232c}
html[data-theme="dark"] .full-table th{background:#1a1a21}`;
 d.head.appendChild(s);
}

/* ---------- Following strip ---------- */
function renderWatch(){
 var host=$('#artistWatch');
 if(!host){host=d.createElement('section');host.id='artistWatch';host.className='artist-watch';var wrap=$('.results-wrap');if(wrap)wrap.prepend(host);}
 var html='<div class="watch-head"><div><h2>Following</h2><p>Track artists and open their full hub.</p></div></div>';
 if(following.length){
   html+='<div class="watch-list">'+following.map(function(x){var a=artistData(x.name);return '<button class="watch-chip" type="button" data-watch="'+esc(x.name)+'"><strong>'+esc(x.name)+'</strong><span>'+(a&&a.dailyStreams?compact(a.dailyStreams)+' daily streams':'Open hub')+'</span></button>';}).join('')+'</div>';
 }else html+='<div class="watch-empty">Follow an artist from their profile. Lady Gaga is preloaded as the initial watchlist artist.</div>';
 host.innerHTML=html;
 host.querySelectorAll('[data-watch]').forEach(function(b){b.addEventListener('click',function(){focusArtist(b.dataset.watch);});});
}
function focusArtist(name){var input=$('#search');if(!input)return;input.value=name;var form=$('#searchForm');if(form)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}

/* ---------- Follow button on profile card ---------- */
function refreshProfileButton(){
 var profile=$('.profile');if(!profile)return;
 var nameEl=profile.querySelector('.profile-name');if(!nameEl)return;
 var name=nameEl.textContent.trim();
 var button=profile.querySelector('.follow-btn');
 if(!button){button=d.createElement('button');button.className='follow-btn';button.type='button';var actions=profile.querySelector('.profile-actions');if(actions)actions.before(button);}
 var f=isFollowing(name);button.textContent=f?'✓ Following':'+ Follow artist';button.classList.toggle('following',f);
 button.onclick=function(){var a=artistData(name);toggle(name,a&&a.spotifyArtistId||'');};
}

/* ---------- Load chart data once ---------- */
async function loadChartData(){
 if(chartData)return chartData;
 try{
   var r=await fetch('data/latest.json',{cache:'no-store'});
   if(r.ok)chartData=await r.json();
 }catch(e){}
 return chartData;
}

/* ---------- Discography from iTunes ---------- */
async function fetchDiscography(artistName){
 var key='discog:'+norm(artistName);
 if(discogCache[key])return discogCache[key];
 var url='https://itunes.apple.com/search?term='+encodeURIComponent(artistName)+'&entity=album&attribute=allArtistTerm&limit=200&country=AU';
 var out=[];
 try{
   var r=await fetch(url);
   if(r.ok){
     var data=(await r.json()).results||[];
     var target=norm(artistName);
     var seen=new Set();
     for(var i=0;i<data.length;i++){
       var x=data[i];
       var an=norm(x.artistName||'');
       if(!an.includes(target)&&!target.includes(an))continue;
       var title=String(x.collectionName||'').trim();
       if(!title)continue;
       var lower=title.toLowerCase();
       if(/karaoke|tribute|in the style of|made famous by|originally performed|cover version/i.test(lower))continue;
       var k=norm(title);
       if(seen.has(k))continue;
       seen.add(k);
       out.push({
         title:title,
         year:String(x.releaseDate||'').slice(0,4),
         artwork:(x.artworkUrl100||'').replace(/100x100/,'600x600'),
         trackCount:x.trackCount||null,
         url:x.collectionViewUrl||null,
         id:x.collectionId
       });
     }
   }
 }catch(e){}
 out.sort(function(a,b){return String(b.year||'').localeCompare(String(a.year||''));});
 out=out.slice(0,40);
 discogCache[key]=out;
 return out;
}

/* ---------- Artist hub ---------- */
async function renderArtistHub(){
 var profile=$('.profile');if(!profile)return;
 var nameEl=profile.querySelector('.profile-name');if(!nameEl)return;
 var name=nameEl.textContent.trim();
 var data=artistData(name);

 var panel=$('#spotifyArtistPanel');
 if(!panel){panel=d.createElement('section');panel.id='spotifyArtistPanel';panel.className='artist-hub';profile.after(panel);}

 if(!data){
   panel.innerHTML='<div class="hub-panel"><h3 style="margin:0 0 8px">Artist hub</h3><div class="empty-note">No tracked statistics are available for this artist yet.</div></div>';
   return;
 }

 var cd=await loadChartData();
 var artistChartRecords=[];
 if(cd&&cd.sources){
   for(var i=0;i<cd.sources.length;i++){
     var s=cd.sources[i];
     if(s.status!=='ok'||!s.entries)continue;
     for(var j=0;j<s.entries.length;j++){
       var e=s.entries[j];
       var matches=(e.artists||[]).some(function(a){return norm(a)===norm(name);});
       if(matches)artistChartRecords.push({source:s.name,rank:e.rank,title:e.title,peakRank:e.peakRank,weeks:e.weeksOnChart,prev:e.previousRank});
     }
   }
 }

 var discog=await fetchDiscography(name);

 var totalStreams=data.totalStreams;
 var topSongs=data.topSongs||[];
 var topAlbums=data.topAlbums||[];
 var chartCount=artistChartRecords.length;
 var bestPeak=artistChartRecords.length?Math.min.apply(null,artistChartRecords.map(function(x){return Number(x.peakRank)||9999;})):null;
 var totalWeeks=artistChartRecords.reduce(function(n,x){return n+(Number(x.weeks)||0);},0);

 var heroArt = discog[0]?.artwork || '';
 var hero='<div class="hub-panel hub-hero"><div class="hub-photo">'+(heroArt?'<img src="'+esc(heroArt)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'"><span class="fallback">'+esc(name.charAt(0).toUpperCase())+'</span>':'<span class="fallback">'+esc(name.charAt(0).toUpperCase())+'</span>')+'</div><div class="hub-info"><div class="hub-label">Artist hub</div><h2 class="hub-name">'+esc(name)+'</h2><p class="hub-summary">Full discography, live chart performance, career streaming totals and every tracked placement in one place.</p><div class="hub-quick"><div><b>'+compact(data.monthlyListeners)+'</b><span>Monthly listeners</span></div><div><b>'+compact(totalStreams)+'</b><span>Total streams</span></div><div><b>'+(bestPeak?'#'+bestPeak:'—')+'</b><span>Best chart peak</span></div><div><b>'+chartCount+'</b><span>Chart appearances</span></div></div></div></div>';

 var discogHTML='';
 if(discog.length){
   discogHTML='<div class="hub-panel hub-section"><h3>Discography<small>'+discog.length+' releases</small></h3><div class="discog-grid">'+discog.map(function(a){
     var badge=a.year||'';
     return '<a class="discog-card" '+(a.url?'href="'+esc(a.url)+'" target="_blank" rel="noopener"':'')+'><div class="discog-art">'+(a.artwork?'<img src="'+esc(a.artwork)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'"><span class="fallback">'+esc(a.title.charAt(0))+'</span>':'<span class="fallback">'+esc(a.title.charAt(0))+'</span>')+'</div><div class="discog-meta"><span class="discog-badge">'+esc(badge)+'</span><span class="discog-title">'+esc(a.title)+'</span><span class="discog-sub"><span>'+(a.trackCount?a.trackCount+' tracks':'Album')+'</span></span></div></a>';
   }).join('')+'</div></div>';
 }

 var chartFootprint='';
 if(artistChartRecords.length){
   var sorted=artistChartRecords.slice().sort(function(a,b){return Number(a.rank)-Number(b.rank);});
   chartFootprint='<div class="hub-panel hub-section"><h3>Live chart footprint<small>'+artistChartRecords.length+' placements</small></h3><div class="chart-footprint">'+sorted.map(function(x){
     return '<div class="cf-row"><span class="cf-source">'+esc(x.title)+'</span><span class="cf-rank">#'+esc(x.rank)+'</span><span class="cf-peak">Peak #'+esc(x.peakRank||'—')+'</span><span class="cf-weeks">'+esc(x.source)+'</span></div>';
   }).join('')+'</div></div>';
 }else{
   chartFootprint='<div class="hub-panel hub-section"><h3>Live chart footprint</h3><div class="empty-note">No current chart placements on any tracked source.</div></div>';
 }

 var streaming='<div class="hub-panel hub-section"><h3>Streaming</h3><div class="hub-metrics"><div class="hub-metric"><strong>'+compact(data.monthlyListeners)+'</strong><span>Monthly listeners</span></div><div class="hub-metric"><strong>'+compact(data.dailyStreams)+'</strong><span>Daily streams</span></div><div class="hub-metric"><strong>'+compact(data.totalStreams)+'</strong><span>Total streams</span></div><div class="hub-metric"><strong>'+fmt(data.tracks)+'</strong><span>Tracks</span></div><div class="hub-metric"><strong>'+compact(data.monthlyListenersPeak)+'</strong><span>Listener peak</span></div><div class="hub-metric"><strong>'+(data.monthlyListenersDailyChange>0?'+':'')+fmt(data.monthlyListenersDailyChange)+'</strong><span>Daily change</span></div></div></div>';

 var topSongsHTML='';
 if(topSongs.length){
   topSongsHTML='<div class="hub-panel hub-section"><h3>Top songs by streams</h3><div class="hub-list">'+topSongs.slice(0,10).map(function(x,i){return '<div class="hub-row"><span class="idx">'+(i+1)+'</span><span class="t">'+esc(x.title)+'</span><span class="v">'+compact(x.streams)+'<small>'+fmt(x.dailyStreams)+' / day</small></span></div>';}).join('')+'</div></div>';
 }

 var topAlbumsHTML='';
 if(topAlbums.length){
   topAlbumsHTML='<div class="hub-panel hub-section"><h3>Top releases by streams</h3><div class="hub-list">'+topAlbums.slice(0,10).map(function(x,i){return '<div class="hub-row"><span class="idx">'+(i+1)+'</span><span class="t">'+esc(x.title)+'</span><span class="v">'+compact(x.streams)+'<small>'+fmt(x.dailyStreams)+' / day</small></span></div>';}).join('')+'</div></div>';
 }

 var chartHistoryHTML='';
 if(data.chartHistory&&data.chartHistory.rows&&data.chartHistory.rows.length){
   var ch=data.chartHistory;
   chartHistoryHTML='<details class="details"><summary>Spotify chart history <span style="color:var(--muted);font-weight:600">'+ch.rows.length+' tracks · '+ch.markets.length+' markets</span></summary><div class="table-scroll"><table class="full-table"><thead><tr><th>Peak date</th><th>Track</th><th class="num">Streams</th>'+ch.markets.map(function(m){return '<th class="num">'+esc(m)+'</th>';}).join('')+'</tr></thead><tbody>'+ch.rows.map(function(row){return '<tr><td>'+esc(row.peakDate)+'</td><td>'+esc(row.title)+'</td><td class="num">'+fmt(row.streams)+'</td>'+ch.markets.map(function(m){return '<td class="num">'+esc(row.peaks&&row.peaks[m]!=null?'#'+row.peaks[m]:'—')+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div></details>';
 }

 var songsHTML='';
 if(Array.isArray(data.songs)&&data.songs.length){
   songsHTML='<details class="details"><summary>Full Spotify song catalogue <span style="color:var(--muted);font-weight:600">'+data.songs.length+' tracks</span></summary><div class="table-scroll"><table class="full-table"><thead><tr><th>#</th><th>Track</th><th class="num">Streams</th><th class="num">Daily</th></tr></thead><tbody>'+data.songs.map(function(x,i){return '<tr><td>'+fmt(i+1)+'</td><td>'+esc(x.title)+'</td><td class="num">'+fmt(x.streams)+'</td><td class="num">'+fmt(x.dailyStreams)+'</td></tr>';}).join('')+'</tbody></table></div></details>';
 }

 var albumsHTML='';
 if(Array.isArray(data.albums)&&data.albums.length){
   albumsHTML='<details class="details"><summary>Full Spotify release catalogue <span style="color:var(--muted);font-weight:600">'+data.albums.length+' releases</span></summary><div class="table-scroll"><table class="full-table"><thead><tr><th>#</th><th>Release</th><th class="num">Streams</th><th class="num">Daily</th></tr></thead><tbody>'+data.albums.map(function(x,i){return '<tr><td>'+fmt(i+1)+'</td><td>'+esc(x.title)+'</td><td class="num">'+fmt(x.streams)+'</td><td class="num">'+fmt(x.dailyStreams)+'</td></tr>';}).join('')+'</tbody></table></div></details>';
 }

 var sourceNote='<div class="hub-panel" style="padding:14px 18px;font-size:11px;color:var(--muted);line-height:1.5">Streaming figures are public Spotify statistics sourced from Kworb (third-party tracker), not Spotify for Artists. Snapshot: '+esc(String((stats&&stats.generatedAt||'')).slice(0,10))+(data.stale?' · last successful snapshot retained':'')+'. Discography artwork via Apple catalogue.'+(chartData&&chartData.generatedAt?' Chart data: '+esc(String(chartData.generatedAt).slice(0,10))+'.':'')+'</div>';

 panel.innerHTML=hero+discogHTML+chartFootprint+'<div class="hub-cols">'+streaming+(topSongsHTML||'<div class="hub-panel hub-section"><h3>Top songs</h3><div class="empty-note">No song data available.</div></div>')+'</div>'+(topAlbumsHTML?'<div class="hub-cols">'+topAlbumsHTML+'<div class="hub-panel hub-section"><h3>Total weeks on chart</h3><div class="hub-metrics"><div class="hub-metric"><strong>'+totalWeeks+'</strong><span>Weeks across all charts</span></div><div class="hub-metric"><strong>'+chartCount+'</strong><span>Chart entries</span></div><div class="hub-metric"><strong>'+(bestPeak?'#'+bestPeak:'—')+'</strong><span>Best peak</span></div></div></div></div>':'')+chartHistoryHTML+songsHTML+albumsHTML+sourceNote;
}

window.strettoSpotifyRefresh=function(){refreshProfileButton();renderArtistHub();};

async function init(){
 style();
 try{var r=await fetch('data/spotify-artists.json',{cache:'no-store'});if(r.ok)stats=await r.json();}catch(e){}
 try{var r2=await fetch('data/following.json',{cache:'no-store'});if(r2.ok)catalog=await r2.json();}catch(e){}
 following=readLocal();if(!following&&Array.isArray(catalog))following=catalog.slice();if(!following)following=[];
 renderWatch();
}
init();
window.strettoSpotify={toggle:toggle,focusArtist:focusArtist};
})();
