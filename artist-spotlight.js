/* Data-driven Artist of the Week / Month editorial spotlight. */
(function(){
  const d=document;
  let mode='week';
  let timer=null;
  function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
  function mount(){
    if(d.querySelector('#artist-spotlight'))return d.querySelector('#artist-spotlight');
    const hero=d.querySelector('.hero'); if(!hero)return null;
    const s=d.createElement('section');s.id='artist-spotlight';s.className='artist-spotlight';
    s.innerHTML='<div class="as-head"><div><span class="as-kicker">EDITORIAL SPOTLIGHT</span><h2>Artist of the <span id="as-period">Week</span></h2><p id="as-sub">The artist making the biggest chart move right now.</p></div><div class="as-tabs" role="tablist" aria-label="Artist spotlight period"><button type="button" class="active" data-period="week" role="tab" aria-selected="true">Week</button><button type="button" data-period="month" role="tab" aria-selected="false">Month</button></div></div><div id="as-content" class="as-content"><div class="as-loading">Analysing current chart movement…</div></div>';
    hero.insertAdjacentElement('afterend',s);
    s.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.period;s.querySelectorAll('[data-period]').forEach(x=>{const on=x.dataset.period===mode;x.classList.toggle('active',on);x.setAttribute('aria-selected',String(on))});render()}));
    return s;
  }
  function entries(){
    try{return typeof all==='function'?all().filter(e=>e.status==='ok'&&Number.isFinite(Number(e.rank))):[]}
    catch(_){return[]}
  }
  function artistName(e){return Array.isArray(e.artists)&&e.artists.length?e.artists[0]:''}
  function candidates(){
    const es=entries(), map=new Map;
    es.forEach(e=>{
      const names=Array.isArray(e.artists)?e.artists.filter(Boolean):[];
      names.forEach(name=>{
        const k=String(name).trim();if(!k)return;
        if(!map.has(k))map.set(k,{name:k,entries:[],rises:0,newEntries:0,best:999,sources:new Set,songs:new Set,top10:0,points:0});
        const a=map.get(k), rank=Number(e.rank);a.entries.push(e);a.best=Math.min(a.best,rank);a.sources.add(e.source);if(e.title)a.songs.add(e.title);if(rank<=10)a.top10++;
        let mv=null;try{mv=typeof movementValue==='function'?movementValue(e):(Number.isFinite(Number(e.movement))?Number(e.movement):null)}catch(_){}
        if(mv>0){a.rises++;a.points+=Math.min(30,mv*3)}
        if(mv===null)a.newEntries++;
        if(rank<=10)a.points+=14;
        else if(rank<=25)a.points+=7;
        else if(rank<=50)a.points+=3;
        a.points+=Math.max(0,8-rank/15);
      });
    });
    return [...map.values()].filter(a=>a.entries.length).map(a=>{a.score=a.points+a.rises*4+a.newEntries*3+a.top10*2;return a}).sort((a,b)=>b.score-a.score);
  }
  function reason(a){
    if(a.rises>=2)return 'Multiple placements are climbing at once.';
    if(a.rises===1)return 'One of the strongest upward moves in the current dataset.';
    if(a.newEntries>=2)return 'A burst of new chart entries is putting them on the radar.';
    if(a.top10>=2)return 'Several songs are holding premium chart positions.';
    return 'Their current chart footprint is unusually strong.';
  }
  function render(){
    const host=mount();if(!host)return;
    const list=candidates(),a=list[0],content=d.querySelector('#as-content');if(!content)return;
    d.querySelector('#as-period').textContent=mode==='month'?'Month':'Week';
    d.querySelector('#as-sub').textContent=mode==='month'?'The standout artist across the strongest available chart footprint.':'The artist making the biggest chart move right now.';
    if(!a){content.innerHTML='<div class="as-empty">Not enough current chart movement data to select a spotlight yet.</div>';return}
    const rises=a.rises, rank=a.best===999?'—':`#${a.best}`, sourceCount=a.sources.size, songs=a.songs.size;
    const sorted=a.entries.slice().sort((x,y)=>Number(x.rank)-Number(y.rank)).slice(0,4);
    const artwork=a.entries.find(e=>e.artworkUrl)?.artworkUrl||'';
    const rows=sorted.map(e=>{let mv='NEW',cls='new';try{const v=typeof movementValue==='function'?movementValue(e):null;if(v>0){mv='↑ '+v;cls='up'}else if(v<0){mv='↓ '+Math.abs(v);cls='down'}else if(v===0){mv='—';cls='flat'}}catch(_){}return `<div class="as-song"><span>${esc(e.title||'Untitled')}</span><b>#${esc(e.rank)}</b><i class="${cls}">${mv}</i></div>`}).join('');
    content.innerHTML=`<div class="as-hero"><div class="as-art-wrap">${artwork?`<img src="${esc(artwork)}" alt="${esc(a.name)} artwork" loading="lazy">`:'<div class="as-art-fallback">♪</div>'}<span class="as-badge">${mode==='month'?'MONTH':'WEEK'}</span></div><div class="as-main"><span class="as-label">${mode==='month'?'THE MONTH’S STANDOUT':'FASTEST-MOVING ARTIST'}</span><h3>${esc(a.name)}</h3><p>${esc(reason(a))}</p><div class="as-stats"><div><strong>${rises||'—'}</strong><span>rising placements</span></div><div><strong>${rank}</strong><span>best current rank</span></div><div><strong>${songs}</strong><span>songs charting</span></div><div><strong>${sourceCount}</strong><span>chart sources</span></div></div></div><div class="as-side"><div class="as-side-title">Current footprint</div>${rows}</div></div><div class="as-footer"><span>Selected automatically from the current StrettoCharts dataset.</span><b>Why now? ${esc(reason(a))}</b></div>`;
  }
  function start(){mount();render();const results=d.querySelector('#results');if(results){const ob=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(render,180)});ob.observe(results,{childList:true,subtree:true});}setInterval(render,60000)}
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',()=>setTimeout(start,900));else setTimeout(start,900);
})();
