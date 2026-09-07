/*
 * Selected-profile presentation layer.
 * Keeps Artist / Song / Album identity authoritative while adding release context,
 * catalogue information, chart footprint and useful media metadata.
 *
 * This is deliberately isolated from search selection and chart rendering:
 * search chooses the entity, this module renders supplementary entity information.
 */
(function(){
  const d=document;
  const $=s=>d.querySelector(s);
  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const text=(e,...keys)=>{for(const k of keys)if(e?.[k]!=null&&String(e[k]).trim())return String(e[k]).trim();return ''};
  const state={data:null,key:''};

  function entries(){
    return state.data?.sources?.flatMap(s=>(s.entries||[]).map(e=>({...e,source:s.name,status:s.status})))
      .filter(e=>e.status==='ok'&&Number.isFinite(Number(e.rank)))||[];
  }
  function artists(e){return Array.isArray(e.artists)?e.artists:[]}
  function album(e){return text(e,'album','albumName','release','releaseTitle')}
  function artwork(e){return text(e,'artworkUrl','artwork','imageUrl')}

  async function getJSON(url){
    try{const r=await fetch(url,{signal:AbortSignal.timeout(5000)});if(!r.ok)return null;return await r.json()}
    catch(_){return null}
  }
  async function iTunesSearch(term,entity,limit=20){
    const j=await getJSON('https://itunes.apple.com/search?term='+encodeURIComponent(term)+'&media=music&entity='+entity+'&limit='+limit+'&country=AU');
    return j?.results||[];
  }
  async function lookup(id,entity){
    const j=await getJSON('https://itunes.apple.com/lookup?id='+encodeURIComponent(id)+'&entity='+entity+'&country=AU');
    return j?.results||[];
  }

  function injectStyle(){
    if($('#stretto-profile-enrichment-style'))return;
    const s=d.createElement('style');s.id='stretto-profile-enrichment-style';
    s.textContent=`
      .sc-profile-context{margin-top:13px;display:grid;gap:13px}
      .sc-context-card{background:#fff;border:1px solid #e4e4ed;border-radius:23px;padding:20px;box-shadow:0 8px 28px #24243b0d}
      .sc-context-head{display:flex;justify-content:space-between;gap:15px;align-items:end;margin-bottom:13px}
      .sc-context-head h3{margin:0;font-size:18px;letter-spacing:-.02em}
      .sc-context-head p{margin:4px 0 0;color:#717282;font-size:11px;line-height:1.4}
      .sc-status{padding:14px 16px;border-radius:16px;background:#f1efff;border:1px solid #ddd7ff;color:#4c4478;font-size:12px;line-height:1.5}
      .sc-album-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .sc-album{display:grid;grid-template-columns:64px 1fr;gap:11px;align-items:center;padding:10px;border-radius:16px;background:#f8f8fc;border:1px solid #eeeef3}
      .sc-album img,.sc-feature img{width:64px;height:64px;border-radius:13px;object-fit:cover;background:#ececf3}
      .sc-album strong,.sc-feature strong{display:block;font-size:12px}
      .sc-album span,.sc-feature span{display:block;margin-top:4px;color:#717282;font-size:9px;line-height:1.35}
      .sc-album small{display:block;margin-top:5px;color:#717282;font-size:8px;line-height:1.35}
      .sc-feature{display:grid;grid-template-columns:92px 1fr;gap:15px;align-items:center;padding:11px;border-radius:17px;background:#f8f8fc}
      .sc-feature img{width:92px;height:92px;border-radius:16px}
      .sc-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}
      .sc-meta span{padding:6px 9px;border-radius:99px;background:#f1efff;color:#4c4478;font-size:10px}
      .sc-song-grid{display:grid;gap:8px}
      .sc-song{display:grid;grid-template-columns:46px 1fr auto;gap:10px;align-items:center;padding:9px;border-radius:14px;background:#f8f8fc}
      .sc-song img{width:46px;height:46px;border-radius:10px;object-fit:cover;background:#ececf3}
      .sc-song strong{display:block;font-size:11px}.sc-song span{display:block;margin-top:3px;color:#717282;font-size:9px}
      .sc-song b{font-size:11px;white-space:nowrap}
      .sc-track-list{display:grid;gap:7px;margin-top:12px}
      .sc-track{display:grid;grid-template-columns:30px 1fr auto;gap:9px;align-items:center;padding:8px 10px;border-radius:11px;background:#f8f8fc;font-size:11px}
      .sc-track i{font-style:normal;color:#717282;font-size:9px}.sc-track small{color:#717282;text-align:right}
      @media(max-width:900px){.sc-album-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:600px){.sc-album-grid{grid-template-columns:1fr}.sc-feature{grid-template-columns:72px 1fr}.sc-feature img{width:72px;height:72px}.sc-song{grid-template-columns:42px 1fr}.sc-song b{grid-column:2;text-align:left}}
    `;
    d.head.appendChild(s);
  }

  function currentPlacements(c){
    const n=norm(c.name),a=norm(c.artist||'');
    if(c.kind==='Artist')return entries().filter(e=>artists(e).some(x=>norm(x)===n));
    if(c.kind==='Song')return entries().filter(e=>norm(e.title)===n&&(!a||artists(e).some(x=>norm(x)===a)));
    return entries().filter(e=>norm(album(e))===n&&(!a||artists(e).some(x=>norm(x)===a)));
  }

  function status(placements){
    if(placements.length)return `<div class="sc-status"><b>Chart status:</b> Currently represented in ${new Set(placements.map(x=>x.source)).size} tracked source${new Set(placements.map(x=>x.source)).size===1?'':'s'} across ${placements.length} current placement${placements.length===1?'':'s'}.</div>`;
    return '<div class="sc-status"><b>Chart status:</b> Not currently charting in any tracked StrettoCharts source. The release information below is still shown.</div>';
  }

  function albumCard(a,placements){
    const matching=placements.filter(e=>norm(album(e))===norm(a.collectionName));
    const year=a.releaseDate?new Date(a.releaseDate).getFullYear():'';
    const art=(a.artworkUrl100||'').replace('100x100','300x300');
    return `<article class="sc-album"><img src="${esc(art)}" alt="" loading="lazy"><div><strong>${esc(a.collectionName)}</strong><span>${esc([year,a.trackCount?`${a.trackCount} tracks`:'',a.primaryGenreName||''].filter(Boolean).join(' · '))}</span><small>${matching.length?'Charting in '+new Set(matching.map(x=>x.source)).size+' tracked source'+(new Set(matching.map(x=>x.source)).size===1?'':'s'):'Not charting in tracked sources'}</small></div></article>`;
  }

  function songRows(placements){
    const map=new Map();
    placements.forEach(e=>{
      const k=norm(e.title)+'::'+norm(artists(e).join(','));
      if(!map.has(k)||Number(e.rank)<Number(map.get(k).rank))map.set(k,e);
    });
    return [...map.values()].sort((a,b)=>Number(a.rank)-Number(b.rank)).slice(0,12).map(e=>`<article class="sc-song"><img src="${esc(artwork(e))}" alt="" loading="lazy"><div><strong>${esc(e.title)}</strong><span>${esc([artists(e).join(', '),album(e)].filter(Boolean).join(' · '))}</span></div><b>#${esc(e.rank)}</b></article>`).join('');
  }

  async function artist(c,placements){
    const found=(await iTunesSearch(c.name,'musicArtist',8)).find(x=>norm(x.artistName)===norm(c.name));
    const albums=found?.artistId?await lookup(found.artistId,'album'):[];
    const clean=albums.filter(x=>x.collectionType==='Album').slice(0,18);
    const albumCount=new Map();
    placements.forEach(e=>{if(album(e))albumCount.set(norm(album(e)),(albumCount.get(norm(album(e)))||0)+1)});
    return `<section class="sc-context-card"><div class="sc-context-head"><div><h3>Artist catalogue</h3><p>Albums and release context are shown independently of current chart status.</p></div></div>${clean.length?`<div class="sc-album-grid">${clean.map(a=>albumCard(a,placements)).join('')}</div>`:'<div class="sc-status">Album catalogue information is not available from the release metadata service right now.</div>'}</section>${placements.length?`<section class="sc-context-card"><div class="sc-context-head"><div><h3>Top current songs</h3><p>Best current positions for this artist in the committed StrettoCharts dataset.</p></div></div><div class="sc-song-grid">${songRows(placements)}</div></section>`:''}`;
  }

  async function song(c,placements){
    const found=(await iTunesSearch(c.name+(c.artist?' '+c.artist:''),'song',12)).find(x=>norm(x.trackName)===norm(c.name)&&(!c.artist||norm(x.artistName)===norm(c.artist)))|| (await iTunesSearch(c.name,'song',12)).find(x=>norm(x.trackName)===norm(c.name));
    if(!found)return '';
    const art=(found.artworkUrl100||'').replace('100x100','600x600');
    const year=found.releaseDate?new Date(found.releaseDate).getFullYear():'';
    return `<section class="sc-context-card"><div class="sc-context-head"><div><h3>Release context</h3><p>The song remains a Song result; the album is supplementary release information.</p></div></div><div class="sc-feature"><img src="${esc(art)}" alt="" loading="lazy"><div><strong>${esc(found.collectionName||'Album unavailable')}</strong><span>${esc([found.artistName,year,found.trackCount?`${found.trackCount} tracks`:'',found.primaryGenreName].filter(Boolean).join(' · '))}</span><div class="sc-meta"><span>${placements.length?'Charting now':'Not currently charting'}</span><span>${esc(found.collectionName?'Album release context':'Release metadata')}</span></div></div></div>${status(placements)}</section>`;
  }

  async function albumProfile(c,placements){
    const source=await iTunesSearch(c.name+(c.artist?' '+c.artist:''),'album',8);
    const found=source.find(x=>norm(x.collectionName)===norm(c.name)&&(!c.artist||norm(x.artistName)===norm(c.artist)))||source.find(x=>norm(x.collectionName)===norm(c.name));
    if(!found?.collectionId)return status(placements);
    const tracks=(await lookup(found.collectionId,'song')).filter(x=>x.wrapperType==='track');
    const rows=tracks.map((t,i)=>{const chart=placements.filter(e=>norm(e.title)===norm(t.trackName));const best=chart.length?Math.min(...chart.map(e=>Number(e.rank))):null;return `<div class="sc-track"><i>${i+1}</i><span>${esc(t.trackName)}</span><small>${best?`#${best}`:'Not charting'}</small></div>`}).join('');
    const art=(found.artworkUrl100||'').replace('100x100','600x600');
    return `<section class="sc-context-card"><div class="sc-context-head"><div><h3>Album details</h3><p>Release metadata and track-level chart presence.</p></div></div><div class="sc-feature"><img src="${esc(art)}" alt="" loading="lazy"><div><strong>${esc(found.collectionName)}</strong><span>${esc([found.artistName,found.releaseDate?new Date(found.releaseDate).toLocaleDateString():'',found.trackCount?`${found.trackCount} tracks`:'',found.primaryGenreName].filter(Boolean).join(' · '))}</span></div></div>${status(placements)}${rows?`<div class="sc-track-list">${rows}</div>`:''}</section>`;
  }

  async function render(){
    if(!state.data){try{const r=await fetch('data/latest.json');if(r.ok)state.data=await r.json()}catch(_){return}}
    const profile=$('.profile');if(!profile)return;
    const kind=profile.querySelector('.profile-kind')?.textContent.replace(/\s*profile\s*$/i,'').trim()||'';
    const name=profile.querySelector('.profile-name')?.textContent.trim()||'';
    if(!kind||!name)return;
    const key=kind+'::'+norm(name);if(key===state.key)return;
    state.key=key;
    const c={kind,name};
    const summary=profile.querySelector('.profile-summary')?.textContent||'';
    const artistMatch=summary.match(/\sby\s(.+?)(?:\.|\s—)/);if(artistMatch)c.artist=artistMatch[1].trim();
    const placements=currentPlacements(c);
    const wrap=d.createElement('div');wrap.className='sc-profile-context';wrap.innerHTML=kind==='Artist'?await artist(c,placements):kind==='Song'?await song(c,placements):await albumProfile(c,placements);
    profile.insertAdjacentElement('afterend',wrap);
  }

  function init(){injectStyle();render();new MutationObserver(()=>render()).observe(d.body,{childList:true,subtree:true})}
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})();
