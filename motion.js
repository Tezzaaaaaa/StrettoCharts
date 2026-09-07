/* StrettoCharts motion system: lightweight, native CSS/JS interactions inspired by modern component libraries. */
(function(){
  const d=document;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q=s=>d.querySelector(s);
  const qa=s=>Array.from(d.querySelectorAll(s));

  function addMotionCSS(){
    if(q('#stretto-motion-css')) return;
    const s=d.createElement('style'); s.id='stretto-motion-css';
    s.textContent=`
      .sc-reveal{opacity:0;transform:translateY(14px)}
      .sc-reveal.sc-visible{opacity:1;transform:none;transition:opacity .48s ease,transform .48s cubic-bezier(.2,.7,.2,1)}
      .candidate,.profile,.chart-summary,.album-info,.analytics-panel,.rank,.source{will-change:auto}
      .candidate.sc-enter{animation:sc-enter .42s cubic-bezier(.2,.7,.2,1) both}
      .chart.sc-enter{animation:sc-chart-in .4s cubic-bezier(.2,.7,.2,1) both}
      .sc-number{font-variant-numeric:tabular-nums}
      @keyframes sc-enter{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
      @keyframes sc-chart-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
      @media(prefers-reduced-motion:reduce){.sc-reveal{opacity:1;transform:none}.candidate.sc-enter,.chart.sc-enter{animation:none}}
    `;
    d.head.appendChild(s);
  }

  function countUp(el){
    if(reduce||el.dataset.counted==='1') return;
    const raw=el.textContent.trim();
    const m=raw.match(/^(#?)([0-9][0-9,]*)(.*)$/);
    if(!m) return;
    const target=Number(m[2].replace(/,/g,'')); if(!Number.isFinite(target)||target>1000000) return;
    el.dataset.counted='1'; el.classList.add('sc-number');
    const prefix=m[1],suffix=m[3]; const start=performance.now(); const duration=650;
    function tick(now){const p=Math.min(1,(now-start)/duration);const eased=1-Math.pow(1-p,3);el.textContent=prefix+Math.round(target*eased).toLocaleString()+suffix;if(p<1)requestAnimationFrame(tick)}
    requestAnimationFrame(tick);
  }

  function reveal(root){
    const els=Array.from((root||d).querySelectorAll('.profile,.chart-summary,.album-info,.analytics-panel,.rank,.source,.standout-card,.search-results-panel,.analytics-story'));
    if(!els.length)return;
    if(reduce){els.forEach(e=>e.classList.add('sc-visible'));return;}
    const io=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('sc-visible');io.unobserve(x.target)}}),{threshold:.08});
    els.forEach((e,i)=>{e.classList.add('sc-reveal');e.style.transitionDelay=Math.min(i*35,210)+'ms';io.observe(e)});
  }

  function stagger(root){
    const candidates=(root||d).querySelectorAll('.candidate');
    candidates.forEach((e,i)=>{e.classList.remove('sc-enter');void e.offsetWidth;e.style.animationDelay=Math.min(i*45,270)+'ms';e.classList.add('sc-enter')});
    const charts=(root||d).querySelectorAll('.chart');
    charts.forEach((e,i)=>{e.classList.remove('sc-enter');void e.offsetWidth;e.style.animationDelay=Math.min(i*30,240)+'ms';e.classList.add('sc-enter')});
  }

  function numbers(root){
    (root||d).querySelectorAll('.num,.profile-stat strong,.rank strong').forEach(countUp);
  }

  function observeResults(){
    const target=q('#results'); if(!target)return;
    const mo=new MutationObserver(()=>{requestAnimationFrame(()=>{stagger(target);reveal(target);numbers(target)})});
    mo.observe(target,{childList:true,subtree:true});
  }

  addMotionCSS();
  observeResults();
  requestAnimationFrame(()=>{reveal();numbers();stagger()});
})();
