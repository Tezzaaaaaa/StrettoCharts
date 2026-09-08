/*
 * Bits UI -> native DOM conversion for StrettoCharts.
 *
 * Mirrors the useful behavior of Bits primitives without importing Svelte:
 * - Tabs / segmented navigation
 * - Accordion
 * - Toggle / switch
 * - Toolbar keyboard navigation
 * - Tooltip
 * - Select
 *
 * The primitives use native elements, ARIA, data-state and roving focus so
 * existing StrettoCharts markup can adopt them incrementally.
 */
(function(){
  const d=document;
  const q=(root,s)=>root.querySelector(s);
  const qa=(root,s)=>Array.from(root.querySelectorAll(s));
  const setState=(el,on)=>{el.dataset.state=on?'on':'off';el.setAttribute('aria-pressed',String(on));};

  function tabs(root){
    const triggers=qa(root,'[data-bits-tab]');
    const panels=qa(root,'[data-bits-panel]');
    if(!triggers.length)return;
    const activate=value=>{
      triggers.forEach((t,i)=>{
        const on=t.dataset.bitsTab===value;
        t.setAttribute('role','tab');t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;t.dataset.state=on?'active':'inactive';
        const panel=panels.find(p=>p.dataset.bitsPanel===t.dataset.bitsTab);
        if(panel){panel.hidden=!on;panel.dataset.state=on?'active':'inactive';panel.setAttribute('role','tabpanel');}
      });
    };
    triggers.forEach((t,i)=>{
      t.addEventListener('click',()=>activate(t.dataset.bitsTab));
      t.addEventListener('keydown',e=>{
        if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
        e.preventDefault();let n=i;
        if(e.key==='ArrowRight')n=(i+1)%triggers.length;
        if(e.key==='ArrowLeft')n=(i-1+triggers.length)%triggers.length;
        if(e.key==='Home')n=0;if(e.key==='End')n=triggers.length-1;
        triggers[n].focus();activate(triggers[n].dataset.bitsTab);
      });
    });
    activate((triggers.find(t=>t.dataset.default==='true')||triggers[0]).dataset.bitsTab);
  }

  function accordions(root){
    qa(root,'[data-bits-accordion]').forEach(group=>{
      qa(group,'[data-bits-trigger]').forEach(trigger=>{
        const content=q(group,'[data-bits-content="'+CSS.escape(trigger.dataset.bitsTrigger)+'"]');
        if(!content)return;
        const id=content.id||('bits-content-'+Math.random().toString(36).slice(2));content.id=id;
        trigger.setAttribute('aria-controls',id);trigger.setAttribute('aria-expanded',String(trigger.dataset.open==='true'));
        content.hidden=trigger.dataset.open!=='true';
        trigger.addEventListener('click',()=>{
          const open=trigger.getAttribute('aria-expanded')!=='true';
          trigger.setAttribute('aria-expanded',String(open));trigger.dataset.state=open?'open':'closed';content.hidden=!open;content.dataset.state=open?'open':'closed';
        });
        trigger.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();trigger.click()}});
      });
    });
  }

  function toggles(root){
    qa(root,'[data-bits-toggle],[data-bits-switch]').forEach(control=>{
      const isSwitch=control.hasAttribute('data-bits-switch');
      const on=control.dataset.value==='true'||control.getAttribute('aria-checked')==='true'||control.getAttribute('aria-pressed')==='true';
      control.setAttribute('role',isSwitch?'switch':'button');
      if(isSwitch)control.setAttribute('aria-checked',String(on));else control.setAttribute('aria-pressed',String(on));
      setState(control,on);
      control.addEventListener('click',()=>{
        const next=control.dataset.state!=='on';setState(control,next);
        if(isSwitch)control.setAttribute('aria-checked',String(next));
        control.dispatchEvent(new CustomEvent('bits:change',{detail:{value:next},bubbles:true}));
      });
      control.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();control.click()}});
    });
  }

  function toolbar(root){
    qa(root,'[data-bits-toolbar]').forEach(bar=>{
      const items=qa(bar,'button,[role="button"],input,select');
      items.forEach((item,i)=>{item.tabIndex=i===0?0:-1;item.addEventListener('keydown',e=>{
        if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();let n=i;
        if(e.key==='ArrowRight')n=(i+1)%items.length;if(e.key==='ArrowLeft')n=(i-1+items.length)%items.length;if(e.key==='Home')n=0;if(e.key==='End')n=items.length-1;items[n].focus();
      })});
    });
  }

  function tooltips(root){
    qa(root,'[data-bits-tooltip]').forEach(trigger=>{
      let tip;
      const text=trigger.getAttribute('data-bits-tooltip');if(!text)return;
      const show=()=>{if(tip)return;tip=d.createElement('div');tip.className='sc-bits-tooltip';tip.textContent=text;tip.setAttribute('role','tooltip');d.body.appendChild(tip);const r=trigger.getBoundingClientRect();tip.style.left=(r.left+r.width/2)+'px';tip.style.top=(r.bottom+8)+'px';};
      const hide=()=>{tip?.remove();tip=null};
      trigger.addEventListener('mouseenter',show);trigger.addEventListener('mouseleave',hide);trigger.addEventListener('focus',show);trigger.addEventListener('blur',hide);
    });
  }

  function selects(root){
    qa(root,'[data-bits-select]').forEach(select=>{
      const trigger=q(select,'[data-bits-select-trigger]');const content=q(select,'[data-bits-select-content]');if(!trigger||!content)return;
      trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');content.hidden=true;
      const close=()=>{content.hidden=true;trigger.setAttribute('aria-expanded','false');};
      trigger.addEventListener('click',()=>{const open=content.hidden;content.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open)q(content,'[data-bits-select-item]')?.focus()});
      qa(content,'[data-bits-select-item]').forEach(item=>{item.setAttribute('role','option');item.tabIndex=-1;item.addEventListener('click',()=>{trigger.textContent=item.textContent;trigger.dataset.value=item.dataset.value||'';qa(content,'[data-bits-select-item]').forEach(x=>x.setAttribute('aria-selected',String(x===item)));close();trigger.focus();});});
      d.addEventListener('click',e=>{if(!select.contains(e.target))close()});
      trigger.addEventListener('keydown',e=>{if(e.key==='Escape'){close();trigger.focus()}});
    });
  }

  function init(root=d){tabs(root);accordions(root);toggles(root);toolbar(root);tooltips(root);selects(root);}
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',()=>init());else init();
  window.StrettoBits={init,tabs,accordions,toggles,toolbar,tooltips,selects};
})();