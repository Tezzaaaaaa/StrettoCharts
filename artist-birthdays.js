/* Daily artist birthday shoutouts powered by Wikidata. */
(function(){
  const d=document,ENDPOINT='https://query.wikidata.org/sparql',CACHE='strettocharts-birthday-v2';
  const occupations=['wd:Q639669','wd:Q177220','wd:Q2252262','wd:Q488205','wd:Q36834','wd:Q855091'];
  const wrap=(n,max)=>(n+max)%max;
  const lerp=(a,b,t)=>a+(b-a)*t;
  let rows=[],index=0,rafId=0,tiltCleanups=[];

  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const today=()=>{const date=new Date();return{month:date.getMonth()+1,day:date.getDate(),date};};
  const age=birth=>{if(!birth)return null;const b=new Date(birth),t=new Date();let n=t.getFullYear()-b.getFullYear();if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate()))n--;return n>0?n:null;};

  function mount(){
    if(d.querySelector('#artist-birthdays'))return d.querySelector('#artist-birthdays');
    const anchor=d.querySelector('#artist-spotlight')||d.querySelector('.hero');
    if(!anchor)return null;
    const s=d.createElement('section');
    s.id='artist-birthdays';
    s.className='artist-birthdays';
    s.innerHTML='<div class="ab-head"><div><span class="ab-kicker">TODAY IN MUSIC</span><h2>Birthday shoutouts</h2><p id="ab-date">Today’s artists and musicians.</p></div><div class="ab-count" id="ab-count">—</div></div><div id="ab-content" class="ab-content"><div class="ab-loading">Finding today’s music birthdays…</div></div><details class="ab-about"><summary>About this feature</summary><div class="ab-explain"><strong>What it is</strong><span>A daily celebration of artists and musicians whose verified birth date falls on today’s calendar date.</span><strong>How it is selected</strong><span>StrettoCharts queries Wikidata for people classified in music-related occupations and filters verified birth dates to today’s month and day.</span><strong>Source</strong><span>Wikidata records can change as corrections are made.</span></div></details>';
    anchor.insertAdjacentElement('afterend',s);
    return s;
  }

  function query(month,day){return `SELECT DISTINCT ?person ?personLabel ?birth ?image ?description WHERE { ?person wdt:P569 ?birth. VALUES ?occupation { ${occupations.join(' ')} } ?person wdt:P106 ?occupation. FILTER(MONTH(?birth)=${month} && DAY(?birth)=${day}) OPTIONAL { ?person wdt:P18 ?image. } OPTIONAL { ?person schema:description ?description. FILTER(LANG(?description)="en") } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 36`;}

  async function fetchBirthdays(){
    const {month,day}=today(),key=`${CACHE}:${month}-${day}`;
    try{const cached=JSON.parse(sessionStorage.getItem(key)||'null');if(cached&&Array.isArray(cached.rows))return cached.rows;}catch(_){}
    const res=await fetch(ENDPOINT+'?format=json&query='+encodeURIComponent(query(month,day)),{headers:{Accept:'application/sparql-results+json'}});
    if(!res.ok)throw Error('Birthday lookup failed');
    const json=await res.json();
    const result=(json.results?.bindings||[]).map(r=>({name:r.personLabel?.value||'',birth:r.birth?.value||'',image:r.image?.value||'',description:r.description?.value||'',uri:r.person?.value||''})).filter(x=>x.name).sort((a,b)=>(b.image?1:0)-(a.image?1:0)||a.name.localeCompare(b.name));
    try{sessionStorage.setItem(key,JSON.stringify({rows:result,at:Date.now()}));}catch(_){}
    return result;
  }

  class Vec2{
    constructor(x=0,y=0){this.x=x;this.y=y;}
    set(x,y){this.x=x;this.y=y;}
    lerp(v,t){this.x=lerp(this.x,v.x,t);this.y=lerp(this.y,v.y,t);}
  }

  function tilt(node,target){
    const rot={current:new Vec2(),target:new Vec2()};
    const bg={current:new Vec2(),target:new Vec2()};
    let amount=.06,alive=true;
    const move=e=>{
      amount=.1;
      const ox=(e.offsetX-node.clientWidth*.5)/(Math.PI*3);
      const oy=-(e.offsetY-node.clientHeight*.5)/(Math.PI*4);
      rot.target.set(ox,oy);
      bg.target.set(-ox*.3,oy*.3);
    };
    const leave=()=>{amount=.06;rot.target.set(0,0);bg.target.set(0,0);};
    node.addEventListener('mousemove',move);
    node.addEventListener('mouseleave',leave);
    const tick=()=>{
      if(!alive)return;
      rot.current.lerp(rot.target,amount);
      bg.current.lerp(bg.target,amount);
      target.style.setProperty('--rotX',rot.current.y.toFixed(2)+'deg');
      target.style.setProperty('--rotY',rot.current.x.toFixed(2)+'deg');
      target.style.setProperty('--bgPosX',bg.current.x.toFixed(2)+'%');
      target.style.setProperty('--bgPosY',bg.current.y.toFixed(2)+'%');
      rafId=requestAnimationFrame(tick);
    };
    tick();
    const cleanup=()=>{alive=false;node.removeEventListener('mousemove',move);node.removeEventListener('mouseleave',leave);};
    tiltCleanups.push(cleanup);
  }

  function cardMarkup(x,number){
    const a=age(x.birth),meta=a?`Born ${new Date(x.birth).getFullYear()} · ${a} today`:'Birthday today';
    return `<a class="ab-slide" href="${esc(x.uri)}" target="_blank" rel="noopener" aria-label="Open ${esc(x.name)} on Wikidata"><div class="ab-slide__inner"><div class="ab-slide--image__wrapper"><div class="ab-slide--image" style="background-image:url('${esc(x.image||'')}')">${x.image?`<img src="${esc(x.image)}" alt="" loading="eager">`:'<span class="ab-no-image">♪</span>'}</div></div><div class="ab-slide__copy"><span class="ab-index">${String(number).padStart(2,'0')}</span><h3>${esc(x.name)}</h3><p>${esc(x.description||'Music artist')}</p><small>${esc(meta)}</small></div><span class="ab-link" aria-hidden="true">↗</span></div></a>`;
  }

  function makeCarousel(){
    const content=d.querySelector('#ab-content');
    if(!content||!rows.length)return;
    tiltCleanups.forEach(fn=>fn());tiltCleanups=[];
    const total=rows.length;
    index=wrap(index,total);
    content.innerHTML=`<div class="ab-slider" aria-live="polite"><button type="button" class="ab-slider--btn ab-slider--btn__prev" aria-label="Previous birthday artist"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5 8 12l6.5 7"/></svg></button><div class="ab-slides__wrapper"><div class="ab-slides"></div></div><button type="button" class="ab-slider--btn ab-slider--btn__next" aria-label="Next birthday artist"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 5 6.5 7-6.5 7"/></svg></button></div><div class="ab-controls"><span class="ab-position">${index+1} / ${total}</span></div>`;
    const slides=content.querySelector('.ab-slides');
    const active=[wrap(index-1,total),index,wrap(index+1,total)];
    const nodes=active.map((rowIndex,slot)=>{
      const holder=d.createElement('div');
      holder.innerHTML=cardMarkup(rows[rowIndex],rowIndex+1);
      const node=holder.firstElementChild;
      node.dataset[slot===0?'previous':slot===1?'current':'next']='';
      node.style.zIndex=slot===1?'20':slot===0?'10':'30';
      slides.appendChild(node);
      tilt(node,node.querySelector('.ab-slide__inner'));
      return node;
    });
    content.querySelector('.ab-slider--btn__prev').addEventListener('click',()=>change(-1));
    content.querySelector('.ab-slider--btn__next').addEventListener('click',()=>change(1));
  }

  function change(direction){
    const total=rows.length;if(total<2)return;
    const slider=d.querySelector('#ab-content .ab-slides');
    if(!slider||slider.dataset.animating==='1')return;
    slider.dataset.animating='1';
    const current=slider.querySelector('.ab-slide[data-current]');
    const previous=slider.querySelector('.ab-slide[data-previous]');
    const next=slider.querySelector('.ab-slide[data-next]');
    if(!current||!previous||!next){slider.dataset.animating='0';return;}
    index=wrap(index+direction,total);
    const newPrevious=wrap(index-1,total),newNext=wrap(index+1,total);
    current.removeAttribute('data-current');
    previous.removeAttribute('data-previous');
    next.removeAttribute('data-next');
    if(direction===1){
      current.dataset.previous='';current.style.zIndex='10';
      next.dataset.current='';next.style.zIndex='20';
      previous.dataset.next='';previous.style.zIndex='30';
      previous.addEventListener('transitionend',()=>recycle(previous,newNext,index+1),{once:true});
    }else{
      current.dataset.next='';current.style.zIndex='30';
      previous.dataset.current='';previous.style.zIndex='20';
      next.dataset.previous='';next.style.zIndex='10';
      next.addEventListener('transitionend',()=>recycle(next,newPrevious,newPrevious+1),{once:true});
    }
    const pos=d.querySelector('#ab-content .ab-position');if(pos)pos.textContent=`${index+1} / ${total}`;
    window.setTimeout(()=>{slider.dataset.animating='0';},850);
  }

  function recycle(node,rowIndex,number){
    const cleanIndex=wrap(rowIndex,rows.length);
    const oldInner=node.querySelector('.ab-slide__inner');
    const replacement=d.createElement('div');
    replacement.innerHTML=cardMarkup(rows[cleanIndex],cleanIndex+1);
    const fresh=replacement.firstElementChild;
    node.replaceChildren(...fresh.childNodes);
    node.href=fresh.getAttribute('href');
    node.setAttribute('aria-label',fresh.getAttribute('aria-label'));
    node.querySelector('.ab-slide__inner').style.setProperty('--rotX','0deg');
    node.querySelector('.ab-slide__inner').style.setProperty('--rotY','0deg');
    node.removeAttribute('data-current');node.removeAttribute('data-previous');node.removeAttribute('data-next');
    node.dataset[cleanIndex===index?'current':cleanIndex===wrap(index-1,rows.length)?'previous':'next']='';
    tilt(node,node.querySelector('.ab-slide__inner'));
  }

  function render(){
    const host=mount();if(!host)return;
    const {date}=today();
    d.querySelector('#ab-date').textContent=`${new Intl.DateTimeFormat(undefined,{month:'long',day:'numeric'}).format(date)} — celebrating artists whose birthdays fall today.`;
    d.querySelector('#ab-count').textContent=rows.length?`${rows.length} ${rows.length===1?'artist':'artists'}`:'TODAY';
    if(!rows.length){d.querySelector('#ab-content').innerHTML='<div class="ab-empty"><strong>No verified music birthdays returned for today.</strong><span>StrettoCharts will check again tomorrow.</span></div>';return;}
    makeCarousel();
  }

  async function start(){
    mount();
    try{rows=await fetchBirthdays();render();}
    catch(_){const content=d.querySelector('#ab-content');if(content)content.innerHTML='<div class="ab-empty"><strong>Birthday data is temporarily unavailable.</strong><span>The daily feature will retry on the next page load.</span></div>';}
  }

  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',()=>setTimeout(start,1100));else setTimeout(start,1100);
})();
