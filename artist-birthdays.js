/* Daily artist birthday shoutouts powered by Wikidata. */
(function(){
  const d=document;
  const ENDPOINT='https://query.wikidata.org/sparql';
  const CACHE='strettocharts-birthday-v1';
  const occupations=['wd:Q639669','wd:Q177220','wd:Q2252262','wd:Q488205','wd:Q36834','wd:Q855091'];

  function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function today(){const now=new Date();return {month:now.getMonth()+1,day:now.getDate(),date:now};}
  function age(birth){if(!birth)return null;const b=new Date(birth),t=new Date();let n=t.getFullYear()-b.getFullYear();if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate()))n--;return n>0?n:null;}
  function dateLabel(date){return new Intl.DateTimeFormat(undefined,{month:'long',day:'numeric'}).format(date);}
  function mount(){
    if(d.querySelector('#artist-birthdays'))return d.querySelector('#artist-birthdays');
    const anchor=d.querySelector('#artist-spotlight')||d.querySelector('.hero');
    if(!anchor)return null;
    const s=d.createElement('section');s.id='artist-birthdays';s.className='artist-birthdays';
    s.innerHTML='<div class="ab-head"><div><span class="ab-kicker">TODAY IN MUSIC</span><h2>Birthday shoutouts</h2><p id="ab-date">Today’s artists and musicians.</p></div><div class="ab-count" id="ab-count">—</div></div><div id="ab-content" class="ab-content"><div class="ab-loading">Finding today’s music birthdays…</div></div><details class="ab-about"><summary>About this feature</summary><div class="ab-explain"><strong>What it is</strong><span>A daily celebration of artists and musicians whose verified birth date falls on today’s calendar date.</span><strong>Why it matters</strong><span>It adds a human, historical layer to the live charts — connecting the music being measured today with the people who shaped music across generations.</span><strong>How it is selected</strong><span>StrettoCharts queries Wikidata for people classified in music-related occupations and filters their verified birth dates to today’s month and day. Multiple birthday artists can be featured.</span><strong>Source</strong><span>Wikidata. Birth dates and artist classifications can be community-maintained and may change as records are corrected.</span></div></details>';
    anchor.insertAdjacentElement('afterend',s);
    return s;
  }
  function query(month,day){
    const values=occupations.join(' ');
    return `SELECT DISTINCT ?person ?personLabel ?birth ?image ?description WHERE { ?person wdt:P569 ?birth. VALUES ?occupation { ${values} } ?person wdt:P106 ?occupation. FILTER(MONTH(?birth)=${month} && DAY(?birth)=${day}) OPTIONAL { ?person wdt:P18 ?image. } OPTIONAL { ?person schema:description ?description. FILTER(LANG(?description)="en") } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 36`;
  }
  async function fetchBirthdays(){
    const {month,day}=today();
    const key=`${CACHE}:${month}-${day}`;
    try{
      const cached=JSON.parse(sessionStorage.getItem(key)||'null');
      if(cached&&Array.isArray(cached.rows))return cached.rows;
    }catch(_){}
    const url=ENDPOINT+'?format=json&query='+encodeURIComponent(query(month,day));
    const res=await fetch(url,{headers:{Accept:'application/sparql-results+json'}});
    if(!res.ok)throw new Error('Birthday lookup failed');
    const json=await res.json();
    const rows=(json.results?.bindings||[]).map(r=>({
      name:r.personLabel?.value||'',birth:r.birth?.value||'',image:r.image?.value||'',description:r.description?.value||'',uri:r.person?.value||''
    })).filter(x=>x.name).sort((a,b)=>(b.image?1:0)-(a.image?1:0)||a.name.localeCompare(b.name));
    try{sessionStorage.setItem(key,JSON.stringify({rows,at:Date.now()}))}catch(_){}
    return rows;
  }
  function render(rows){
    const host=mount();if(!host)return;
    const {date}=today();
    d.querySelector('#ab-date').textContent=`${dateLabel(date)} — celebrating artists whose birthdays fall today.`;
    d.querySelector('#ab-count').textContent=rows.length?`${rows.length} ${rows.length===1?'artist':'artists'}`:'TODAY';
    const content=d.querySelector('#ab-content');
    if(!rows.length){content.innerHTML='<div class="ab-empty"><strong>No verified music birthdays returned for today.</strong><span>StrettoCharts will check again tomorrow. The source is deliberately conservative rather than guessing a birth date.</span></div>';return;}
    content.innerHTML=rows.slice(0,8).map((x,i)=>{
      const a=age(x.birth),meta=a?`Born ${new Intl.DateTimeFormat(undefined,{year:'numeric'}).format(new Date(x.birth))} · ${a} today`:'';
      return `<a class="ab-card" href="${esc(x.uri)}" target="_blank" rel="noopener" aria-label="Open ${esc(x.name)} on Wikidata"><div class="ab-art">${x.image?`<img src="${esc(x.image)}" alt="" loading="lazy">`:'<span>♪</span>'}</div><div class="ab-copy"><span class="ab-index">${String(i+1).padStart(2,'0')}</span><h3>${esc(x.name)}</h3><p>${esc(x.description||'Music artist')}</p><small>${esc(meta||'Birthday today')}</small></div><span class="ab-link" aria-hidden="true">↗</span></a>`;
    }).join('');
  }
  async function start(){
    mount();
    try{render(await fetchBirthdays())}
    catch(_){const content=d.querySelector('#ab-content');if(content)content.innerHTML='<div class="ab-empty"><strong>Birthday data is temporarily unavailable.</strong><span>The daily feature uses Wikidata and will retry on the next page load.</span></div>';}
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',()=>setTimeout(start,1100));else setTimeout(start,1100);
})();
