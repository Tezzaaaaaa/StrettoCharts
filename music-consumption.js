/* Public-source music consumption intelligence.
 * Keep measurements separate: revenue, units and subscription accounts are not interchangeable.
 * The public IFPI State of the Industry release supports global annual format revenue;
 * detailed five-year/monthly format data requires licensed access, so StrettoCharts does not invent it.
 */
(function(){
  const d=document;
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const global=[
    {year:2024,streaming:20.4,physical:4.8,downloads:0.83,performance:2.9,sync:0.65},
    {year:2025,streaming:22.0,physical:5.3,downloads:0.79,performance:2.9,sync:0.641}
  ];
  const physicalUS2025=[
    {format:'Vinyl',units:47.8},
    {format:'CD',units:33.8}
  ];
  const facts=[
    ['Paid streaming','837M','global paid subscription accounts in 2025','IFPI'],
    ['Streaming revenue','US$22B+','69.6% of global recorded-music revenue in 2025','IFPI'],
    ['Vinyl growth','+13.7%','19th consecutive year of global vinyl revenue growth in 2025','IFPI'],
    ['Physical revenue','US$5.3B','global physical-format revenue in 2025, up 8.0%','IFPI']
  ];
  function mount(){
    if(d.querySelector('#music-consumption'))return d.querySelector('#music-consumption');
    const anchor=d.querySelector('#analytics')||d.querySelector('.metrics')||d.querySelector('.hero');
    if(!anchor)return null;
    const s=d.createElement('section');s.id='music-consumption';s.className='section music-consumption';
    s.innerHTML=`<div class="mc-head"><div><span class="mc-kicker">MUSIC CONSUMPTION INTELLIGENCE</span><h2>How We Listen</h2><p>Track the formats, markets and behaviour shaping the recorded-music economy.</p></div><div class="mc-source">Public industry data · updated with published reports</div></div>
      <div class="mc-facts">${facts.map(x=>`<article class="mc-fact"><span>${esc(x[0])}</span><strong>${esc(x[1])}</strong><p>${esc(x[2])}</p><small>${esc(x[3])}</small></article>`).join('')}</div>
      <div class="mc-grid">
        <article class="mc-panel mc-wide"><div class="mc-panel-head"><div><h3>Global music formats</h3><p>Recorded-music revenue by major consumption medium.</p></div><span>US$ billions</span></div><div class="mc-chart" id="mc-global-chart"></div><div class="mc-explain"><b>What it means</b><p>Streaming dominates the global recorded-music economy, while physical formats returned to growth in 2025. These are <strong>revenue</strong> figures, not listener counts or units.</p></div></article>
        <article class="mc-panel"><div class="mc-panel-head"><div><h3>Physical format race</h3><p>Published U.S. 2025 album-unit snapshot.</p></div><span>million units</span></div><div class="mc-bars" id="mc-physical-bars"></div><div class="mc-explain"><b>Why it matters</b><p>Vinyl remained the largest U.S. physical album format in 2025. CD also showed renewed momentum, demonstrating that physical consumption is not one single trend.</p></div></article>
      </div>
      <article class="mc-panel mc-method"><div><span class="mc-kicker">DATA STANDARD</span><h3>Units are not listeners</h3><p>StrettoCharts keeps streams, subscription accounts, physical units and revenue separate. A sale is not a listener; a subscription account is not necessarily one person; and a stream is not a unique listener.</p></div><div class="mc-method-grid"><div><b>Global format revenue</b><span>IFPI published annual figures</span></div><div><b>Physical units</b><span>Luminate published U.S. sales data</span></div><div><b>Monthly worldwide units</b><span>Added only when a legitimate public or licensed source supplies the required series</span></div></div></article>`;
    anchor.insertAdjacentElement('afterend',s);
    renderGlobal();renderPhysical();return s;
  }
  function renderGlobal(){
    const host=d.querySelector('#mc-global-chart');if(!host)return;
    const keys=[['streaming','Streaming'],['physical','Physical'],['downloads','Downloads & digital'],['performance','Performance rights'],['sync','Synchronisation']];
    const max=22.2;
    host.innerHTML=`<div class="mc-axis"><span>2024</span><span>2025</span></div><div class="mc-lines">${keys.map(([k,label])=>{const a=global.map(x=>x[k]);const y1=100-(a[0]/max*100),y2=100-(a[1]/max*100);return `<div class="mc-line-row"><span>${esc(label)}</span><div class="mc-line"><i style="left:0%;top:${y1}%"></i><i style="left:100%;top:${y2}%"></i><b style="left:0%;top:${y1}%;width:100%;transform:translateY(${y2-y1}%)"></b></div><em>${a[1].toFixed(k==='sync'?3:1)}</em></div>`}).join('')}</div><div class="mc-values">${global.map(x=>`<div><b>${x.year}</b><span>Streaming $${x.streaming.toFixed(1)}B · Physical $${x.physical.toFixed(1)}B</span></div>`).join('')}</div>`;
  }
  function renderPhysical(){
    const host=d.querySelector('#mc-physical-bars');if(!host)return;
    const max=Math.max(...physicalUS2025.map(x=>x.units));
    host.innerHTML=physicalUS2025.map(x=>`<div class="mc-bar"><div><b>${esc(x.format)}</b><span>${x.units.toFixed(1)}M</span></div><i><em style="width:${x.units/max*100}%"></em></i></div>`).join('');
  }
  function start(){setTimeout(mount,1000)}
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start);else start();
})();