/* StrettoCharts chart history: source-aware history, honest time ranges, and native SVG interaction. */
(function(){
  const d=document;
  const $=s=>d.querySelector(s);
  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const palette=['#0071e3','#7c4dff','#ff375f','#1f9d55','#ff9f43','#5e5ce6'];
  let snapshots=[];
  let lastProfile='';
  let renderToken=0;

  function addStyle(){
    if($('#stretto-history-css'))return;
    const s=d.createElement('style');
    s.id='stretto-history-css';
    s.textContent=`
      .chart-history{border-radius:24px;padding:24px;background:#fff;border:1px solid #d2d2d7;box-shadow:0 8px 28px rgba(0,0,0,.06)}
      .chart-history h3{margin:0;font-size:20px;letter-spacing:-.02em;color:#1d1d1f}
      .history-sub{margin:6px 0 16px;color:#6e6e73;font-size:12px;line-height:1.55}
      .history-controls{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:0 0 16px}
      .history-control-label{font-size:12px;font-weight:600;color:#6e6e73}
      .history-segmented{display:flex;gap:3px;flex-wrap:wrap;padding:3px;border-radius:12px;background:#f5f5f7}
      .history-segmented button{appearance:none;border:0;background:transparent;color:#6e6e73;border-radius:9px;padding:7px 10px;font:600 12px -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,Arial,sans-serif;cursor:pointer;transition:background .18s ease,color .18s ease,box-shadow .18s ease}
      .history-segmented button[aria-pressed="true"]{background:#fff;color:#1d1d1f;box-shadow:0 1px 4px rgba(0,0,0,.12)}
      .history-segmented button:disabled{opacity:.42;cursor:default}
      .history-segmented button:focus-visible{outline:2px solid #0071e3;outline-offset:2px}
      .history-sources{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}
      .history-source{appearance:none;border:0;padding:6px 9px;border-radius:999px;background:#f5f5f7;color:#6e6e73;font:600 10px -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,Arial,sans-serif;cursor:pointer}
      .history-source[aria-pressed="true"]{background:#1d1d1f;color:#fff}
      .history-source:focus-visible{outline:2px solid #0071e3;outline-offset:2px}
      .history-svg{width:100%;height:auto;display:block}
      .history-series{transition:opacity .18s ease}
      .history-point{transition:opacity .18s ease,transform .18s ease}
      .history-empty{padding:20px;border-radius:16px;background:#f5f5f7;color:#6e6e73;font-size:12px;line-height:1.55}
      .history-note{margin-top:14px;padding:12px 14px;border-radius:14px;background:#f5f5f7;color:#6e6e73;font-size:11px;line-height:1.55}
      @media(max-width:600px){.chart-history{padding:17px}.history-controls{align-items:flex-start}.history-segmented{width:100%}.history-segmented button{flex:1}.history-svg{min-height:210px}.history-sources{margin-bottom:10px}}
      @media(prefers-reduced-motion:reduce){.history-segmented button,.history-series,.history-point{transition:none}}
    `;
    d.head.appendChild(s);
  }

  async function load(){
    try{
      const r=await fetch('./data/history/index.json?t='+Date.now(),{cache:'no-store'});
      const dates=await r.json();
      const loaded=await Promise.all(dates.map(async date=>{
        try{const x=await fetch('./data/history/'+date+'.json?t='+Date.now(),{cache:'no-store'});return x.ok?await x.json():null}catch(_){return null}
      }));
      snapshots=loaded.filter(Boolean).sort((a,b)=>new Date(a.generatedAt)-new Date(b.generatedAt));
    }catch(_){snapshots=[]}
  }

  function entries(snap){
    return snap?.sources?.flatMap(s=>(s.entries||[]).filter(e=>s.status==='ok'&&Number.isFinite(+e.rank)).map(e=>({...e,source:s.name})))||[];
  }
  const artists=e=>e.artists||[];
  function match(e,name,kind,artist){
    const n=norm(name),a=norm(artist);
    if(kind==='Artist')return artists(e).some(x=>norm(x)===n);
    if(kind==='Album')return norm(e.album||e.albumName||e.release||e.releaseTitle)===n&&(!a||artists(e).some(x=>norm(x)===a));
    return norm(e.title)===n&&(!a||artists(e).some(x=>norm(x)===a));
  }

  function collect(name,kind,artist){
    const rows=[];
    snapshots.forEach(s=>{
      entries(s).filter(e=>match(e,name,kind,artist)).forEach(e=>rows.push({date:String(s.generatedAt).slice(0,10),rank:+e.rank,source:e.source}));
    });
    const bySource=new Map();
    rows.forEach(r=>{if(!bySource.has(r.source))bySource.set(r.source,[]);bySource.get(r.source).push(r)});
    return {rows,series:[...bySource.entries()].map(([source,rs])=>({source,rs:rs.sort((a,b)=>a.date.localeCompare(b.date))}))};
  }

  function ranges(dates){
    const latest=dates.length?new Date(dates[dates.length-1]+'T00:00:00'):null;
    const span=latest&&dates.length?Math.max(0,(latest-new Date(dates[0]+'T00:00:00'))/86400000):0;
    return [
      {key:'30',label:'30D',days:30},
      {key:'90',label:'90D',days:90},
      {key:'365',label:'1Y',days:365},
      {key:'all',label:'All',days:null}
    ].map(r=>({...r,disabled:r.days!==null&&span<r.days}));
  }

  function renderHistory(holder,name,kind,artist,releaseDate){
    const token=++renderToken;
    const {rows,series}=collect(name,kind,artist);
    const dates=[...new Set(rows.map(r=>r.date))].sort();
    if(!dates.length){
      holder.innerHTML=`<h3>Chart position over time</h3><div class="history-sub">Historical rank tracking for this result.</div><div class="history-empty">No historical chart snapshots currently contain this ${kind.toLowerCase()}. Current chart positions are still shown above. As daily snapshots accumulate, this graph will populate automatically.</div>`;
      return;
    }

    const W=900,H=330,L=58,R=20,T=25,B=48;
    const allRanks=rows.map(r=>r.rank);
    const max=Math.max(10,...allRanks);
    const min=1;
    const x=i=>L+(dates.length===1?0.5:(i/(dates.length-1)))*(W-L-R);
    const y=v=>T+((v-min)/(max-min||1))*(H-T-B);
    const ticks=[1,Math.max(2,Math.round(max*.25)),Math.max(3,Math.round(max*.5)),Math.max(4,Math.round(max*.75)),max].filter((v,i,a)=>v>=1&&a.indexOf(v)===i).sort((a,b)=>a-b);
    const spanLabel=dates.length===1?'1 snapshot':`${dates.length} snapshots`;
    const release=releaseDate?new Date(releaseDate).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'';

    holder.innerHTML=`
      <h3>Chart position over time</h3>
      <div class="history-sub">How ${esc(name)} has moved through the tracked charts. Higher on the graph means a better chart position (#1 is at the top).</div>
      <div class="history-controls">
        <span class="history-control-label">Time period · ${spanLabel}</span>
        <div class="history-segmented" role="group" aria-label="History time period"></div>
      </div>
      <div class="history-sources" role="group" aria-label="History chart sources"></div>
      <svg class="history-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Chart position over time for ${esc(name)}"></svg>
      <div class="history-note">${release?'Release date: '+esc(release)+'. ':''}This graph uses only committed historical StrettoCharts snapshots; no ranks are invented. Additional daily snapshots will extend the available history automatically.</div>`;

    const rangeBar=holder.querySelector('.history-segmented');
    const sourceBar=holder.querySelector('.history-sources');
    const svg=holder.querySelector('.history-svg');
    const rangeOptions=ranges(dates);
    let activeRange=rangeOptions.find(r=>!r.disabled)?.key||'all';
    let activeSources=new Set(series.map(q=>q.source));

    rangeBar.innerHTML=rangeOptions.map(r=>`<button type="button" data-range="${r.key}" aria-pressed="${r.key===activeRange?'true':'false'}"${r.disabled?' disabled':''}>${r.label}</button>`).join('');
    sourceBar.innerHTML=series.map((q,i)=>`<button type="button" class="history-source" data-history-source="${esc(q.source)}" aria-pressed="true" title="Toggle ${esc(q.source)}"><span aria-hidden="true">●</span> ${esc(q.source)}</button>`).join('');

    function filteredDates(){
      if(activeRange==='all')return dates;
      const option=rangeOptions.find(r=>r.key===activeRange);
      if(!option||option.days===null)return dates;
      const latest=new Date(dates[dates.length-1]+'T00:00:00');
      const cutoff=new Date(latest);cutoff.setDate(cutoff.getDate()-option.days);
      return dates.filter(date=>new Date(date+'T00:00:00')>=cutoff);
    }

    function draw(){
      if(token!==renderToken)return;
      const visibleDates=filteredDates();
      const visibleRows=rows.filter(r=>activeSources.has(r.source)&&visibleDates.includes(r.date));
      const localMax=Math.max(10,...visibleRows.map(r=>r.rank));
      const localX=i=>L+(visibleDates.length===1?0.5:(i/(visibleDates.length-1)))*(W-L-R);
      const localY=v=>T+((v-min)/(localMax-min||1))*(H-T-B);
      const localTicks=[1,Math.max(2,Math.round(localMax*.25)),Math.max(3,Math.round(localMax*.5)),Math.max(4,Math.round(localMax*.75)),localMax].filter((v,i,a)=>v>=1&&a.indexOf(v)===i).sort((a,b)=>a-b);
      const grid=localTicks.map(v=>`<line x1="${L}" y1="${localY(v)}" x2="${W-R}" y2="${localY(v)}" stroke="#e5e5ea"/><text x="${L-10}" y="${localY(v)+4}" text-anchor="end" font-size="11" fill="#6e6e73">#${v}</text>`).join('');
      const labels=visibleDates.map((date,i)=>`<text x="${localX(i)}" y="${H-17}" text-anchor="middle" font-size="10" fill="#6e6e73">${new Date(date+'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:visibleDates.length>5?'2-digit':'numeric'})}</text>`).join('');
      const paths=series.map((q,si)=>{
        if(!activeSources.has(q.source))return '';
        const color=palette[si%palette.length];
        const pts=visibleDates.map((date,i)=>{const r=q.rs.find(z=>z.date===date);return r?[localX(i),localY(r.rank),r.rank,r.date]:null}).filter(Boolean);
        if(!pts.length)return '';
        return `<g class="history-series" data-source="${esc(q.source)}" style="color:${color}"><polyline points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><g>${pts.map(p=>`<circle class="history-point" cx="${p[0]}" cy="${p[1]}" r="4.5" fill="#fff" stroke="${color}" stroke-width="3"><title>${esc(q.source)} · ${p[3]} · #${p[2]}</title></circle>`).join('')}</g></g>`;
      }).join('');
      const empty=visibleRows.length===0?`<text x="${W/2}" y="${H/2}" text-anchor="middle" font-size="12" fill="#6e6e73">No chart positions in this view.</text>`:'';
      svg.innerHTML=`${grid}${paths}${labels}<text x="${L}" y="${H-3}" font-size="10" fill="#6e6e73">Earlier</text><text x="${W-R}" y="${H-3}" text-anchor="end" font-size="10" fill="#6e6e73">Current</text>${empty}`;
    }

    rangeBar.addEventListener('click',e=>{
      const b=e.target.closest('button[data-range]');if(!b||b.disabled)return;
      activeRange=b.dataset.range;
      rangeBar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));
      draw();
    });
    sourceBar.addEventListener('click',e=>{
      const b=e.target.closest('button[data-history-source]');if(!b)return;
      const source=b.dataset.historySource;
      if(activeSources.has(source)){
        if(activeSources.size===1)return;
        activeSources.delete(source);b.setAttribute('aria-pressed','false');
      }else{activeSources.add(source);b.setAttribute('aria-pressed','true')}
      draw();
    });
    draw();
  }

  function labelLeaders(){
    const title=$('#title'),sub=$('#sub');
    if(title&&title.textContent==='Current chart leaders'){
      title.textContent='Current chart leaders — by chart';
      if(sub)sub.textContent='The leading records from each tracked chart source, clearly labelled so positions are easy to compare.';
    }
    d.querySelectorAll('#results .song').forEach(card=>{
      if(card.querySelector('.chart-section-label'))return;
      const source=card.querySelector('.source-name')?.textContent?.trim();
      if(source){const x=d.createElement('div');x.className='chart-section-label';x.innerHTML=`<strong>${esc(source)} chart</strong><span>Current leader / featured position</span>`;card.prepend(x)}
    });
  }

  function observeProfile(){
    const p=$('#results .profile');
    if(!p)return;
    const name=p.querySelector('.profile-name')?.textContent.trim()||'';
    const kind=p.querySelector('.profile-kind')?.textContent.replace(' profile','').trim()||'Song';
    const key=kind+'::'+name;
    if(key===lastProfile)return;
    lastProfile=key;
    const summary=p.querySelector('.profile-summary')?.textContent||'';
    const artist=kind==='Artist'?name:(summary.match(/\bby\s+(.+?)\s+—/)||[])[1]||'';
    const release=(summary.match(/release(?:d)?[: ]+([A-Za-z0-9 ,]+)/i)||[])[1]||'';
    const holder=d.createElement('section');
    holder.className='chart-history';
    const charts=p.parentNode.querySelector('.charts');
    if(charts)charts.insertAdjacentElement('afterend',holder);else p.parentNode.appendChild(holder);
    renderHistory(holder,name,kind,artist,release);
  }

  function start(){
    addStyle();
    load().then(()=>{
      labelLeaders();
      observeProfile();
      const target=$('#results');
      if(!target)return;
      const mo=new MutationObserver(()=>requestAnimationFrame(()=>{labelLeaders();observeProfile()}));
      mo.observe(target,{childList:true,subtree:true});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
