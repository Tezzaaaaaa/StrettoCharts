/* Search mode: keep the page focused on the selected entity and its own data. */
(function(){
  const d=document;
  const $=s=>d.querySelector(s);
  const sections=()=>[...d.querySelectorAll('main.wrap > section')];
  let active=false;
  function setSearchMode(on){
    active=on;
    const metrics=d.querySelector('.metrics');
    if(metrics)metrics.hidden=on;
    sections().forEach(section=>{
      if(section.classList.contains('section')){
        const heading=section.querySelector('h2');
        const id=heading?.id||'';
        const text=(heading?.textContent||'').toLowerCase();
        const isResults=section.querySelector('#results');
        const isAnalytics=text.includes('dataset analytics');
        const isRankings=text.includes('artist ranking snapshot');
        const isCoverage=text.includes('chart coverage');
        if(isResults)section.hidden=false;
        else if(isAnalytics||isRankings||isCoverage)section.hidden=on;
      }
    });
    const hero=d.querySelector('.hero');
    if(hero)hero.classList.toggle('search-active',on);
  }
  function refineProfile(){
    const kind=d.querySelector('.profile-kind');
    if(!kind)return;
    const k=kind.textContent.toLowerCase();
    const stats=d.querySelector('.profile-stats');
    if(stats){
      [...stats.children].forEach((el,i)=>{
        const label=(el.querySelector('span')?.textContent||'').toLowerCase();
        let keep=true;
        if(k.includes('artist'))keep=['best current position','chart sources','chart placements','matching songs'].some(x=>label.includes(x));
        else if(k.includes('song'))keep=['best current position','chart sources','chart placements'].some(x=>label.includes(x));
        else if(k.includes('album'))keep=['best current position','chart sources','chart placements','album tracks'].some(x=>label.includes(x));
        el.hidden=!keep;
      });
    }
    const title=d.querySelector('#title');
    if(title)title.textContent=k.includes('artist')?'Artist':k.includes('song')?'Song':'Album';
  }
  function watch(){
    const results=$('#results');
    if(!results)return;
    const observer=new MutationObserver(()=>{
      const hasProfile=!!results.querySelector('.profile');
      const hasCandidates=!!results.querySelector('.search-results-panel');
      if(hasProfile||hasCandidates)setSearchMode(true);
      if(hasProfile)refineProfile();
    });
    observer.observe(results,{childList:true,subtree:true});
    results.addEventListener('click',e=>{
      if(e.target.closest('#changeSearch')||e.target.closest('#backToResults')){
        setSearchMode(false);
        setTimeout(()=>setSearchMode(true),0);
      }
    });
  }
  function addStyle(){
    const s=d.createElement('style');
    s.textContent='section[hidden],.metric[hidden],.profile-stat[hidden]{display:none!important}.search-active .updated{color:#c9c5d7}.search-active + .metrics{display:none}';
    d.head.appendChild(s);
  }
  function init(){addStyle();watch()}
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})();
