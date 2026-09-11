/* StrettoCharts controls: chart-source filtering, profile navigation, and fixed display-theme control. */
(function(){
  const d=document,$=s=>d.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const themeKey='strettocharts-theme';
  let lastKey='';

  function systemTheme(){return window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light'}
  function applyTheme(theme,persist){
    const value=theme==='dark'?'dark':'light';
    d.documentElement.dataset.theme=value;
    d.documentElement.style.colorScheme=value;
    if(persist)try{localStorage.setItem(themeKey,value)}catch(e){}
    const input=$('#stretto-theme-checkbox');
    if(input)input.checked=value==='dark';
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
      .sc-segmented button:focus-visible{outline:2px solid #0071e3;outline-offset:2px}
      .sc-filter-empty{padding:18px;border-radius:15px;background:#f5f5f7;color:#6e6e73;font-size:12px;margin-top:10px}
      .sc-profile-nav{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 18px}
      .sc-profile-nav a{color:#0071e3;text-decoration:none;font-size:12px;font-weight:600;padding:7px 10px;border-radius:999px;background:#f5f5f7}
      .sc-profile-nav a:hover{text-decoration:underline}

      /* Theme switch: vanilla CSS/HTML conversion of the supplied animated switch. */
      .sc-theme-wrap{position:fixed;top:16px;right:16px;z-index:2147483647;display:flex;align-items:center}
      .theme-switch{--toggle-size:16px;--container-width:5.625em;--container-height:2.5em;--container-radius:6.25em;--container-light-bg:#3d7eae;--container-night-bg:#1d1f2c;--circle-container-diameter:3.375em;--sun-moon-diameter:2.125em;--sun-bg:#ecca2f;--moon-bg:#c4c9d1;--spot-color:#959db1;--circle-container-offset:calc((var(--circle-container-diameter) - var(--container-height)) / 2 * -1);--stars-color:#fff;--clouds-color:#f3fdff;--back-clouds-color:#aacadf;--transition:.5s cubic-bezier(0,-.02,.4,1.25);--circle-transition:.3s cubic-bezier(0,-.02,.35,1.17);display:block;position:relative;font-size:var(--toggle-size);line-height:1}
      .theme-switch,.theme-switch *,.theme-switch *::before,.theme-switch *::after{box-sizing:border-box;margin:0;padding:0}
      .theme-switch__checkbox{position:absolute;opacity:0;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
      .theme-switch__container{width:var(--container-width);height:var(--container-height);background-color:var(--container-light-bg);background-image:linear-gradient(to bottom,var(--container-light-bg) 0%,#5490c0 100%);border-radius:var(--container-radius);overflow:hidden;cursor:pointer;position:relative;box-shadow:0em -.062em .062em rgba(0,0,0,.25),0em .062em .125em rgba(255,255,255,.94);transition:all var(--transition)}
      .theme-switch__container::before{content:"";position:absolute;z-index:1;inset:0;box-shadow:0em .05em .187em rgba(0,0,0,.25) inset;border-radius:var(--container-radius);pointer-events:none}
      .theme-switch__circle-container{width:var(--circle-container-diameter);height:var(--circle-container-diameter);background-color:rgba(255,255,255,.1);position:absolute;left:var(--circle-container-offset);top:var(--circle-container-offset);border-radius:var(--container-radius);box-shadow:inset 0 0 0 3.375em rgba(255,255,255,.1),0 0 0 .625em rgba(255,255,255,.1),0 0 0 1.25em rgba(255,255,255,.1);display:flex;transition:var(--circle-transition);pointer-events:none}
      .theme-switch__sun-moon-container{pointer-events:auto;position:relative;z-index:2;width:var(--sun-moon-diameter);height:var(--sun-moon-diameter);margin:auto;border-radius:var(--container-radius);background-color:var(--sun-bg);box-shadow:.062em .062em .062em 0 rgba(254,255,239,.61) inset,0 -.062em .062em 0 #a1872a inset;filter:drop-shadow(.062em .125em .125em rgba(0,0,0,.25)) drop-shadow(0 .062em .125em rgba(0,0,0,.25));overflow:hidden;transition:var(--transition);transform:scale(1)}
      .theme-switch__moon{transform:translateX(100%);width:100%;height:100%;background-color:var(--moon-bg);border-radius:inherit;box-shadow:.062em .062em .062em 0 rgba(254,255,239,.61) inset,0 -.062em .062em 0 #969696 inset;position:relative;transition:var(--transition)}
      .theme-switch__spot{position:absolute;top:.75em;left:.312em;width:.75em;height:.75em;border-radius:var(--container-radius);background-color:var(--spot-color);box-shadow:0 .0312em .062em rgba(0,0,0,.25) inset}
      .theme-switch__spot:nth-of-type(2){width:.375em;height:.375em;top:.937em;left:1.375em}
      .theme-switch__spot:nth-of-type(3){width:.25em;height:.25em;top:.312em;left:.812em}
      .theme-switch__clouds{width:1.25em;height:1.25em;background-color:var(--clouds-color);border-radius:var(--container-radius);position:absolute;bottom:-.625em;left:.312em;box-shadow:.937em .312em var(--clouds-color),-.312em -.312em var(--back-clouds-color),1.437em .375em var(--clouds-color),.5em -.125em var(--back-clouds-color),2.187em 0 var(--clouds-color),1.25em -.062em var(--back-clouds-color),2.937em .312em var(--clouds-color),2em -.312em var(--back-clouds-color),3.625em -.062em var(--clouds-color),2.625em 0 var(--back-clouds-color),4.5em -.312em var(--clouds-color),3.375em -.437em var(--back-clouds-color),4.625em -1.75em 0 .437em var(--clouds-color),4em -.625em var(--back-clouds-color),4.125em -2.125em 0 .437em var(--back-clouds-color);transition:.5s cubic-bezier(0,-.02,.4,1.25)}
      .theme-switch__stars-container{position:absolute;color:var(--stars-color);top:-100%;left:.312em;width:2.75em;height:auto;transition:var(--transition)}
      .theme-switch__stars-container svg{display:block;width:100%;height:auto}
      .theme-switch__shooting-star,.theme-switch__shooting-star-2{position:absolute;background:#fff;left:-10%;opacity:0;transition:opacity .3s ease}
      .theme-switch__shooting-star{width:2px;height:2px;top:20%}.theme-switch__shooting-star-2{width:1px;height:1px;top:35%}
      .theme-switch__meteor{position:absolute;width:3px;height:3px;background:#ffd700;border-radius:50%;top:-10%;left:50%;opacity:0;filter:blur(1px);transition:opacity .3s ease}
      .theme-switch__stars-cluster{position:absolute;inset:0;opacity:0;transition:opacity .3s ease}
      .theme-switch__stars-cluster .star{position:absolute;width:2px;height:2px;background:#fff;border-radius:50%;box-shadow:0 0 4px 1px #fff}
      .theme-switch__stars-cluster .star:nth-child(1){top:20%;left:20%;animation:sc-twinkle 1s infinite ease-in-out}.theme-switch__stars-cluster .star:nth-child(2){top:30%;left:55%;animation:sc-twinkle 1s infinite ease-in-out .3s}.theme-switch__stars-cluster .star:nth-child(3){top:40%;left:80%;animation:sc-twinkle 1s infinite ease-in-out .6s}.theme-switch__stars-cluster .star:nth-child(4){top:60%;left:30%;animation:sc-twinkle 1s infinite ease-in-out .9s}.theme-switch__stars-cluster .star:nth-child(5){top:70%;left:65%;animation:sc-twinkle 1s infinite ease-in-out 1.2s}
      .theme-switch__aurora{position:absolute;top:0;left:0;right:0;height:20px;background:linear-gradient(90deg,rgba(0,255,255,0) 0%,rgba(0,255,255,.2) 25%,rgba(128,0,255,.2) 50%,rgba(0,255,255,.2) 75%,rgba(0,255,255,0) 100%);opacity:0;filter:blur(4px);transform:translateY(-100%);transition:opacity .3s ease}
      .theme-switch__comets{position:absolute;inset:0;overflow:hidden;opacity:0;transition:opacity .3s ease}.theme-switch__comets .comet{position:absolute;width:2px;height:2px;background:linear-gradient(90deg,#fff 0%,transparent 90%);border-radius:50%;filter:blur(1px)}.theme-switch__comets .comet:nth-child(1){top:30%;left:-10%;animation:sc-comet 4s linear infinite}.theme-switch__comets .comet:nth-child(2){top:50%;left:-10%;animation:sc-comet 6s linear infinite 2s}
      .theme-switch__checkbox:focus-visible+.theme-switch__container{outline:2px solid #0071e3;outline-offset:4px}
      .theme-switch__checkbox:checked+.theme-switch__container{background-color:var(--container-night-bg);background-image:linear-gradient(to bottom,var(--container-night-bg) 0%,#2d3142 100%)}
      .theme-switch__checkbox:checked+.theme-switch__container .theme-switch__circle-container{left:calc(100% - var(--circle-container-offset) - var(--circle-container-diameter))}
      .theme-switch__checkbox:checked+.theme-switch__container .theme-switch__moon{transform:translateX(0)}
      .theme-switch__checkbox:checked+.theme-switch__container .theme-switch__clouds{bottom:-4.062em}
      .theme-switch__checkbox:checked+.theme-switch__container .theme-switch__stars-container{top:50%;transform:translateY(-50%)}
      .theme-switch__checkbox:checked+.theme-switch__container .theme-switch__shooting-star{animation:sc-shooting 2s linear infinite;opacity:1}
      .theme-switch__checkbox:checked+.theme-switch__container .theme-switch__shooting-star-2{animation:sc-shooting 3s linear infinite 1s;opacity:1}
      .theme-switch__checkbox:checked+.theme-switch__container .theme-switch__meteor{animation:sc-meteor 4s linear infinite 2s;opacity:1}
      .theme-switch__checkbox:checked+.theme-switch__container .theme-switch__stars-cluster{opacity:1}
      .theme-switch__checkbox:checked+.theme-switch__container .theme-switch__aurora{opacity:1;animation:sc-aurora 8s linear infinite}
      .theme-switch__checkbox:checked+.theme-switch__container .theme-switch__comets{opacity:1}
      .theme-switch:hover .theme-switch__sun-moon-container{transform:scale(1.08) rotate(3deg)}
      .theme-switch:hover .theme-switch__clouds{transform:translateX(4px) scale(1.01)}
      @keyframes sc-twinkle{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
      @keyframes sc-shooting{0%{transform:translate(0,0) rotate(45deg);opacity:1}100%{transform:translate(150px,150px) rotate(45deg);opacity:0}}
      @keyframes sc-meteor{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(150px) scale(.3);opacity:0}}
      @keyframes sc-comet{0%{transform:translate(0,0) rotate(-45deg) scale(1);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translate(200px,200px) rotate(-45deg) scale(.2);opacity:0}}
      @keyframes sc-aurora{0%{transform:translateY(-100%) translateX(-50%)}100%{transform:translateY(-100%) translateX(50%)}}
      @media(max-width:760px){.sc-theme-wrap{top:10px;right:10px}.theme-switch{--toggle-size:14px}}
      @media(prefers-reduced-motion:reduce){.sc-segmented button{transition:none}.theme-switch *,.theme-switch *::before,.theme-switch *::after{animation:none!important;transition:none!important}}
    `;
    d.head.appendChild(s);
  }

  function buildThemeToggle(){
    if($('#stretto-theme-checkbox'))return;
    const wrap=d.createElement('div');wrap.className='sc-theme-wrap';
    wrap.innerHTML=`<label class="theme-switch" title="Toggle Day/Night display"><input id="stretto-theme-checkbox" class="theme-switch__checkbox" type="checkbox" aria-label="Toggle Day/Night display"><div class="theme-switch__container" aria-hidden="true"><div class="theme-switch__clouds"></div><div class="theme-switch__stars-container"><svg fill="none" viewBox="0 0 144 55" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069ZM81 25.3545C82.1114 25.2995 83.0551 24.8503 83.8313 24.0069C84.6075 23.1635 84.9956 22.1642 84.9956 21C84.9956 23.1635 85.3837 24.0069 86.1599 24.0069C86.9361 24.8503 87.8798 25.2903 89 25.3545C88.2679 25.3911 87.5976 25.602 86.9802 26.0053C86.3716 26.3995 85.8864 26.9312 85.5248 27.5913C85.172 28.2513 84.9956 28.9572 84.9956 29.7273C84.9956 28.563 84.6078 27.5546 83.8313 26.7112C83.0551 25.8587 82.1114 25.4095 81 25.3545ZM136 36.3545C137.111 36.2995 138.055 35.8503 138.831 35.0069C139.607 34.1635 139.996 33.1642 139.996 32C139.996 33.1642 140.384 34.1635 141.16 35.0069C141.936 35.8503 142.88 36.2903 144 36.3545C143.268 36.3911 142.598 36.602 141.98 37.0053C141.372 37.3995 140.886 37.9312 140.525 38.5913C140.172 39.2513 139.996 39.9572 139.996 40.7273C139.996 39.563 139.607 38.5546 138.831 37.7112C138.055 36.8587 137.111 36.4095 136 36.3545ZM101.831 49.0069C101.055 49.8503 100.111 50.2995 99 50.3545C100.111 50.4095 101.055 50.8587 101.831 51.7112C102.607 52.5546 102.996 53.563 102.996 54.7273C102.996 53.9572 103.172 53.2513 103.525 52.5913C103.886 51.9312 104.372 51.3995 104.98 51.0053C105.598 50.602 106.268 50.3911 107 50.3545C105.88 50.2903 104.936 49.8503 104.16 49.0069C103.384 48.1635 102.996 47.1642 102.996 46C102.996 47.1642 102.607 48.1635 101.831 49.0069Z" clip-rule="evenodd" fill-rule="evenodd"/></svg></div><div class="theme-switch__circle-container"><div class="theme-switch__sun-moon-container"><div class="theme-switch__moon"><div class="theme-switch__spot"></div><div class="theme-switch__spot"></div><div class="theme-switch__spot"></div></div></div></div><div class="theme-switch__shooting-star"></div><div class="theme-switch__shooting-star-2"></div><div class="theme-switch__meteor"></div><div class="theme-switch__stars-cluster"><div class="star"></div><div class="star"></div><div class="star"></div><div class="star"></div><div class="star"></div></div><div class="theme-switch__aurora"></div><div class="theme-switch__comets"><div class="comet"></div><div class="comet"></div></div></div></label>`;
    d.body.appendChild(wrap);
    wrap.querySelector('input').addEventListener('change',e=>applyTheme(e.target.checked?'dark':'light',true));
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
