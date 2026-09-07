/* StrettoCharts controls: native segmented filtering and accessible profile navigation. */
(function(){
  const d=document,$=s=>d.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  let lastKey='';

  function addStyle(){
    if($('#stretto-controls-css'))return;
    const s=d.createElement('style');s.id='stretto-controls-css';
    s.textContent=`
      .sc-controlbar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:18px 0 12px;padding:10px 12px;border:1px solid #d2d2d7;border-radius:18px;background:#f5f5f7}
      .sc-control-label{font-size:12px;font-weight:600;color:#6e6e73}
      .sc-segmented{display:flex;gap:3px;flex-wrap:wrap;padding:3px;border-radius:12px;background:#e5e5ea}
      .sc-segmented button{appearance:none;border:0;background:transparent;color:#6e6e73;border-radius:9px;padding:8px 11px;font:600 12px -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,Arial,sans-serif;cursor:pointer;transition:background .18s ease,color .18s ease,box-shadow .18s ease}
      .sc-segmented button[aria-pressed="true"]{background:#fff;color:#1d1d1f;box-shadow:0 1px 4px rgba(0,0,0,.12)}
      .sc-segmented button:focus-visible{outline:2px solid #0071e3;outline-offset:2px}
      .sc-filter-empty{padding:18px;border-radius:15px;background:#f5f5f7;color:#6e6e73;font-size:12px;margin-top:10px}
      .sc-profile-nav{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 18px}
      .sc-profile-nav a{color:#0071e3;text-decoration:none;font-size:12px;font-weight:600;padding:7px 10px;border-radius:999px;background:#f5f5f7}
      .sc-profile-nav a:hover{text-decoration:underline}
      @media(max-width:600px){.sc-controlbar{align-items:flex-start}.sc-segmented{width:100%}.sc-segmented button{flex:1}.sc-profile-nav a{padding:8px 10px}}
      @media(prefers-reduced-motion:reduce){.sc-segmented button{transition:none}}
    `;
    d.head.appendChild(s);
  }

  function build(){
    const results=$('#results');if(!results)return;
    const profile=results.querySelector('.profile');
    const charts=results.querySelector('.charts');
    if(!profile||!charts)return;
    const key=(results.querySelector('.profile-name')?.textContent||'')+'::'+(results.querySelector('.profile-kind')?.textContent||'');
    if(key===lastKey&&results.querySelector('.sc-controlbar'))return;
    lastKey=key;
    results.querySelectorAll('.sc-controlbar,.sc-profile-nav').forEach(x=>x.remove());

    const rows=[...charts.querySelectorAll('.chart')];
    const sources=[...new Set(rows.map(r=>r.querySelector('.source-name')?.textContent?.trim()).filter(Boolean))];
    if(sources.length){
      const bar=d.createElement('div');bar.className='sc-controlbar';bar.innerHTML=`<span class="sc-control-label">Chart source</span><div class="sc-segmented" role="group" aria-label="Filter chart sources"><button type="button" data-source="*" aria-pressed="true">All</button>${sources.map(x=>`<button type="button" data-source="${esc(x)}" aria-pressed="false">${esc(x)}</button>`).join('')}</div>`;
      charts.parentNode.insertBefore(bar,charts);
      bar.addEventListener('click',e=>{
        const b=e.target.closest('button[data-source]');if(!b)return;
        const source=b.dataset.source;
        bar.querySelectorAll('button[data-source]').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));
        rows.forEach(r=>{const name=r.querySelector('.source-name')?.textContent?.trim();r.hidden=source!=='*'&&name!==source});
        charts.dataset.filtered=source;
        let empty=charts.nextElementSibling;
        if(!empty?.classList.contains('sc-filter-empty')){empty=d.createElement('div');empty.className='sc-filter-empty';charts.parentNode.insertBefore(empty,charts.nextSibling)}
        const visible=rows.some(r=>!r.hidden);
        empty.hidden=visible;empty.textContent='No chart placement from this source is available for this result.';
      });
    }

    const nav=d.createElement('nav');nav.className='sc-profile-nav';nav.setAttribute('aria-label','Profile sections');
    const links=[['#results .profile','Overview'],['#results .charts','Current charts'],['#results .chart-history','History']];
    nav.innerHTML=links.map(([href,label])=>`<a href="${href}">${label}</a>`).join('');
    profile.parentNode.insertBefore(nav,profile.nextSibling);
  }

  function start(){addStyle();build();const target=$('#results');if(!target)return;const mo=new MutationObserver(()=>requestAnimationFrame(build));mo.observe(target,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
