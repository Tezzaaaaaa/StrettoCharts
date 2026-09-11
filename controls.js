/* StrettoCharts controls: chart-source filtering and fixed display-theme control. */
(function(){
  const d=document,$=s=>d.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>\\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;'}[c]));
  const themeKey='strettocharts-theme';
  let lastKey='';

  function systemTheme(){return window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light'}
  function applyTheme(theme,persist){
    const value=theme==='dark'?'dark':'light';
    d.documentElement.dataset.theme=value;
    d.documentElement.style.colorScheme=value;
    if(persist)try{localStorage.setItem(themeKey,value)}catch(e){}
    const b=$('#stretto-theme-toggle');
    if(b){const dark=value==='dark';b.setAttribute('aria-pressed',String(dark));b.setAttribute('aria-label',dark?'Switch to Day display':'Switch to Night display');b.title=dark?'Switch to Day display':'Switch to Night display';b.querySelector('.sc-theme-icon').textContent=dark?'☀︎':'☾';b.querySelector('.sc-theme-text').textContent=dark?'Day':'Night'}
  }
  function initTheme(){
    let saved=null;try{saved=localStorage.getItem(themeKey)}catch(e){}
    applyTheme(saved==='dark'||saved==='light'?saved:systemTheme(),false);
    const mq=window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change',()=>{try{if(!localStorage.getItem(themeKey))applyTheme(systemTheme(),false)}catch(e){applyTheme(systemTheme(),false)}});
  }

  function addStyle(){
    if($('#stretto-controls-css'))return;
    const s=d.createElement('style');s.id='stretto-controls-css';
    s.textContent=`
      .sc-controlbar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:18px 0 12px;padding:10px 12px;border:1px solid #d2d2d7;border-radius:18px;background:#f5f5f7}
      .sc-control-label{font-size:12px;font-weight:600;color:#6e6e73}
      .sc-segmented{display:flex;gap:3px;flex-wrap:wrap;padding:3px;border-radius:12px;background:#e5e5ea}
      .sc-segmented button{appearance:none;border:0;background:transparent;color:#6e6e73;border-radius:9px;padding:8px 11px;font:600 12px -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,Arial,sans-serif;cursor:pointer;transition:background .18s ease,color .18s ease,box-shadow .18s ease}
      .sc-segmented button[aria-pressed="true"]{background:#fff;color:#1d1d1f;box-shadow:0 1px 4px rgba(0,0,0,.12)}
      .sc-segmented button:focus-visible,.sc-theme-toggle:focus-visible{outline:2px solid #0071e3;outline-offset:2px}
      .sc-filter-empty{padding:18px;border-radius:15px;background:#f5f5f7;color:#6e6e73;font-size:12px;margin-top:10px}
      .sc-profile-nav{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 18px}
      .sc-profile-nav a{color:#0071e3;text-decoration:none;font-size:12px;font-weight:600;padding:7px 10px;border-radius:999px;background:#f5f5f7}
      .sc-profile-nav a:hover{text-decoration:underline}
      .sc-theme-wrap{position:fixed;top:16px;right:16px;z-index:2147483647;display:flex;align-items:center}
      .sc-theme-toggle{appearance:none;border:1px solid #d2d2d7;background:rgba(255,255,255,.92);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:#1d1d1f;border-radius:999px;padding:9px 13px;display:inline-flex;align-items:center;gap:7px;font:600 12px -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,Arial,sans-serif;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,.08);transition:background .18s ease,color .18s ease,border-color .18s ease,transform .18s ease}
      .sc-theme-toggle:hover{transform:translateY(-1px)}
      .sc-theme-icon{font-size:15px;line-height:1}
      .sc-theme-text{min-width:31px;text-align:left}
      @media(max-width:760px){.sc-theme-wrap{top:10px;right:10px}.sc-theme-text{display:none}.sc-theme-toggle{width:40px;height:40px;padding:0;justify-content:center}.sc-theme-icon{font-size:18px}}
      @media(prefers-reduced-motion:reduce){.sc-segmented button,.sc-theme-toggle{transition:none}}
    `;
    d.head.appendChild(s);
  }

  function buildThemeToggle(){
    if($('#stretto-theme-toggle'))return;
    const wrap=d.createElement('div');wrap.className='sc-theme-wrap';
    wrap.innerHTML='<button id="stretto-theme-toggle" class="sc-theme-toggle" type="button" aria-pressed="false"><span class="sc-theme-icon" aria-hidden="true">☾</span><span class="sc-theme-text">Night</span></button>';
    d.body.appendChild(wrap);
    wrap.querySelector('button').addEventListener('click',()=>applyTheme(d.documentElement.dataset.theme==='dark'?'light':'dark',true));
    applyTheme(d.documentElement.dataset.theme||systemTheme(),false);
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

  function start(){addStyle();initTheme();buildThemeToggle();build();const target=$('#results');if(!target)return;const mo=new MutationObserver(()=>requestAnimationFrame(build));mo.observe(target,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
