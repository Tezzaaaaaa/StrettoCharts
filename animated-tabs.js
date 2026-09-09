/* StrettoCharts — ShinUI Animated Tabs adaptation.
   Measures the active trigger itself so the indicator stays aligned when labels or viewport width change. */
(function(){
  'use strict';
  function init(){
    var sections=[].slice.call(document.querySelectorAll('main.wrap > .section'));
    if(!sections.length || document.querySelector('.sc-tabs')) return;

    var labels=['Current Charts','Analytics','Rankings','Coverage'];
    var ids=['current-charts','dataset-analytics','artist-rankings','chart-coverage'];
    sections.forEach(function(section,i){
      section.classList.add('sc-tab-panel');
      section.id=ids[i]||('stretto-section-'+i);
      section.setAttribute('role','tabpanel');
      section.setAttribute('aria-labelledby','sc-tab-'+i);
    });

    var nav=document.createElement('nav');
    nav.className='sc-tabs';
    nav.setAttribute('aria-label','StrettoCharts sections');
    var list=document.createElement('div');
    list.className='sc-tabs-list';
    list.setAttribute('role','tablist');
    var indicator=document.createElement('span');
    indicator.className='sc-tab-indicator';
    list.appendChild(indicator);

    labels.slice(0,sections.length).forEach(function(label,i){
      var button=document.createElement('button');
      button.type='button';
      button.className='sc-tab';
      button.id='sc-tab-'+i;
      button.setAttribute('role','tab');
      button.setAttribute('aria-controls',sections[i].id);
      button.setAttribute('aria-selected',i===0?'true':'false');
      button.tabIndex=i===0?0:-1;
      button.textContent=label;
      button.addEventListener('click',function(){activate(i,true)});
      button.addEventListener('keydown',function(e){
        var next=i;
        if(e.key==='ArrowRight') next=(i+1)%sections.length;
        else if(e.key==='ArrowLeft') next=(i-1+sections.length)%sections.length;
        else if(e.key==='Home') next=0;
        else if(e.key==='End') next=sections.length-1;
        else return;
        e.preventDefault();
        activate(next,true);
      });
      list.appendChild(button);
    });
    nav.appendChild(list);
    var first=sections[0];
    first.parentNode.insertBefore(nav,first);

    var tabs=[].slice.call(list.querySelectorAll('.sc-tab'));
    var active=0;

    function moveIndicator(){
      var tab=tabs[active];
      if(!tab) return;
      var listRect=list.getBoundingClientRect();
      var tabRect=tab.getBoundingClientRect();
      indicator.style.width=tabRect.width+'px';
      indicator.style.transform='translateX('+(tabRect.left-listRect.left+list.scrollLeft)+'px)';
    }

    function activate(index,focus){
      if(index<0||index>=sections.length) return;
      active=index;
      tabs.forEach(function(tab,i){
        var selected=i===index;
        tab.setAttribute('aria-selected',selected?'true':'false');
        tab.tabIndex=selected?0:-1;
        sections[i].hidden=!selected;
      });
      moveIndicator();
      if(focus) tabs[index].focus({preventScroll:true});
      tabs[index].scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
      requestAnimationFrame(moveIndicator);
    }

    activate(0,false);
    window.addEventListener('resize',moveIndicator,{passive:true});
    if(window.ResizeObserver){
      var observer=new ResizeObserver(moveIndicator);
      observer.observe(list);
      tabs.forEach(function(tab){observer.observe(tab)});
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
