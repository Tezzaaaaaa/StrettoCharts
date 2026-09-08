/* StrettoCharts: Bits UI interaction patterns converted to native DOM. */
(function(){
  const d=document,$=s=>d.querySelector(s);
  let data=null;
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const entries=()=>data?.sources?.flatMap(s=>(s.entries||[]).filter(e=>s.status==='ok'&&Number.isFinite(Number(e.rank))).map(e=>({...e,source:s.name})))||[];
  const num=(v,fallback='—')=>Number.isFinite(Number(v))?Number(v):fallback;
  function decorateCards(){
    d.querySelectorAll('.metric').forEach(x=>x.classList.add('sc-bits-stat','sc-bits-card'));
    d.querySelectorAll('.panel,.chart-summary,.song,.profile,.rank,.source,.insight,.chart-history,.stat-chart,.standout-card').forEach(x=>x.classList.add('sc-bits-card'));
  }
  function signal(){
    const metrics=$('.metrics');if(!metrics||$('.sc-bits-signal'))return;
    const es=entries();if(!es.length)return;
    const moves=es.map(e=>Number(e.movement)).filter(Number.isFinite);
    const up=moves.filter(x=>x>0).reduce((a,b)=>a+b,0),down=moves.filter(x=>x<0).reduce((a,b)=>a+Math.abs(b),0);
    const avg=es.reduce((a,e)=>a+Number(e.rank),0)/es.length;
    const best=es.slice().sort((a,b)=>Number(a.rank)-Number(b.rank))[0];
    const sources=data.sources||[],healthy=sources.filter(s=>s.status==='ok').length;
    const wrap=d.createElement('section');wrap.className='sc-bits-signal';wrap.setAttribute('aria-label','Chart signals');
    const movementTotal=up+down,upPct=movementTotal?Math.round(up/movementTotal*100):0;
    wrap.innerHTML=`<article class="sc-bits-signal-card"><div class="sc-bits-status ${healthy===sources.length?'':'warn'}"><i aria-hidden="true"></i>${healthy}/${sources.length} sources healthy</div><h3>Chart signal</h3><p>Compact, source-aware summary of the current snapshot.</p><div class="sc-bits-signal-value"><strong>#${num(avg,'—')}</strong><span>average current position</span></div><div class="sc-bits-signal-track" role="progressbar" aria-label="Share of supplied movement that is upward" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${upPct}"><i style="width:${upPct}%"></i></div></article><article class="sc-bits-signal-card" data-bits-accordion><div class="sc-bits-status"><i aria-hidden="true"></i>Strongest current placement</div><h3>${esc(best?.title||'—')}</h3><p>${esc(best?.artists?.join(', ')||best?.source||'Current dataset')}</p><button type="button" data-bits-trigger="details" data-open="true" class="sc-bits-status" style="margin-top:10px;border:0;background:transparent;padding:0;cursor:pointer">Show chart details</button><div data-bits-content="details" class="sc-bits-accordion-content"><div class="sc-bits-signal-list"><div class="sc-bits-signal-row"><span>Best rank</span><b>${best?'#'+best.rank:'—'}</b></div><div class="sc-bits-signal-row"><span>Upward movement</span><b>${up||0}</b></div><div class="sc-bits-signal-row"><span>Downward movement</span><b>${down||0}</b></div></div></div></article>`;
    metrics.insertAdjacentElement('afterend',wrap);
  }
  function toolbar(){
    const analytics=$('#analytics');
    const anchor=analytics?.closest('.section');if(!anchor||$('.sc-bits-toolbar'))return;
    const bar=d.createElement('div');bar.className='sc-bits-toolbar';bar.setAttribute('data-bits-toolbar','');bar.innerHTML='<span class="sc-bits-toolbar-label">Analytics view</span><div class="sc-bits-segmented" role="tablist" aria-label="Analytics view"><button type="button" data-bits-tab="overview" data-default="true">Overview</button><button type="button" data-bits-tab="rankings">Rankings</button><button type="button" data-bits-tab="coverage">Coverage</button></div>';
    anchor.insertBefore(bar,anchor.querySelector('.head'));
    const sectionFor=id=>document.getElementById(id)?.closest('.section');
    const apply=view=>{
      const targets=[sectionFor('rankings'),sectionFor('coverage')];targets.forEach(x=>x?.classList.add('sc-bits-hidden'));
      if(view==='rankings')sectionFor('rankings')?.classList.remove('sc-bits-hidden');
      if(view==='coverage')sectionFor('coverage')?.classList.remove('sc-bits-hidden');
    };
    bar.querySelectorAll('[data-bits-tab]').forEach(t=>t.addEventListener('click',()=>apply(t.dataset.bitsTab)));
    apply('overview');
    window.StrettoBits?.init(bar);
  }
  async function init(){
    decorateCards();
    try{const r=await fetch('data/latest.json?bits='+Date.now(),{cache:'no-store'});if(r.ok)data=await r.json()}catch(_){}
    signal();toolbar();decorateCards();window.StrettoBits?.init(d);
    const root=$('.wrap');if(root)new MutationObserver(()=>{decorateCards();toolbar()}).observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();