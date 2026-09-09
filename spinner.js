/* StrettoCharts — practical loading states using lightweight inline SVG indicators. */
(function(){
  'use strict';
  var ring='<span class="sc-spinner sc-spinner-ring" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="9"></circle></svg></span>';
  var dots='<span class="sc-spinner-dots" aria-hidden="true"><i></i><i></i><i></i></span>';

  function loadingMarkup(label){
    return '<div class="sc-loading-state" role="status">'+ring+'<span>'+label+'</span></div>';
  }

  function setButtonLoading(button,on){
    if(!button)return;
    if(on){
      if(button.dataset.scOriginalText==null)button.dataset.scOriginalText=button.textContent;
      button.classList.add('sc-is-loading');
      button.setAttribute('aria-busy','true');
      button.innerHTML=ring+'<span>Searching…</span>';
    }else{
      button.classList.remove('sc-is-loading');
      button.removeAttribute('aria-busy');
      if(button.dataset.scOriginalText!=null)button.textContent=button.dataset.scOriginalText;
    }
  }

  function decorateResults(results){
    if(!results)return;
    var empty=results.querySelector('.empty');
    if(empty && /loading/i.test(empty.textContent)){
      empty.innerHTML=loadingMarkup('Loading chart data…');
      empty.classList.add('sc-spinner-host');
    }
  }

  function init(){
    var form=document.getElementById('searchForm');
    var results=document.getElementById('results');
    var button=form&&form.querySelector('.confirm');
    if(form)form.addEventListener('submit',function(){setButtonLoading(button,true);});
    if(results){
      decorateResults(results);
      var observer=new MutationObserver(function(){
        decorateResults(results);
        if(results.querySelector('.profile,.search-results-panel,.song,.chart-summary'))setButtonLoading(button,false);
      });
      observer.observe(results,{childList:true,subtree:true});
    }
    var updated=document.getElementById('updated');
    if(updated && /loading/i.test(updated.textContent)){
      updated.innerHTML='<span class="sc-loading-inline">'+dots+'<span>Loading latest dataset…</span></span>';
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
