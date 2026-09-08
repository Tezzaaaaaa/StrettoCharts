/* Organise visualisations by subject so charts appear in the correct dashboard category. */
(function(){
  const d=document;
  const groups=[
    {id:'category-current',title:'Current Charts',sub:'Live chart positions, source comparisons and searched artist, song or album performance.',selectors:['#results']},
    {id:'category-analytics',title:'Chart Analytics',sub:'Calculated views of the current dataset, chart reach, rank distribution, movement and source coverage.',selectors:['#analytics','#rankings','#coverage']},
    {id:'category-history',title:'Music History & Records',sub:'Documented historical milestones, longevity records and decade-spanning chart achievements.',selectors:['#music-history-charts','#premium-music-facts']},
    {id:'category-consumption',title:'Music Consumption',sub:'How audiences consume recorded music across streaming, physical formats and other recorded-music categories.',selectors:['#music-consumption']},
    {id:'category-editorial',title:'Editorial & Today in Music',sub:'Data-driven artist spotlights and verified calendar features that add context beyond the live charts.',selectors:['#artist-spotlight','#artist-birthdays']}
  ];
  function createGroup(g){
    let host=d.getElementById(g.id);if(host)return host;
    host=d.createElement('section');host.id=g.id;host.className='chart-category';
    host.innerHTML='<div class="category-head"><div><span class="category-kicker">STRETTOCHARTS</span><h2>'+g.title+'</h2><p>'+g.sub+'</p></div></div><div class="category-content"></div>';
    const wrap=d.querySelector('.wrap'),footer=d.querySelector('.footer');
    if(!wrap)return null;
    if(footer)wrap.insertBefore(host,footer);else wrap.appendChild(host);
    return host;
  }
  function organise(){
    groups.forEach(g=>{
      const host=createGroup(g);if(!host)return;
      const content=host.querySelector('.category-content');
      g.selectors.forEach(sel=>{const node=d.querySelector(sel);if(node&&!host.contains(node))content.appendChild(node)});
      host.hidden=!content.children.length;
    });
  }
  function style(){
    if(d.getElementById('chart-category-css'))return;
    const s=d.createElement('style');s.id='chart-category-css';s.textContent=`
      .chart-category{margin-top:34px}.chart-category[hidden]{display:none}.category-head{display:flex;justify-content:space-between;align-items:flex-end;margin:0 2px 12px}.category-kicker{display:block;margin-bottom:4px;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#7657ff}.category-head h2{margin:0;font-size:25px;letter-spacing:-.035em}.category-head p{margin:5px 0 0;max-width:900px;color:#717282;font-size:12px;line-height:1.45}.category-content{display:grid;gap:13px}.category-content>.section{margin-top:0}.category-content>#analytics{display:block}.category-content>#rankings,.category-content>#coverage{margin-top:0}.category-content>#music-history-charts,.category-content>#premium-music-facts,.category-content>#music-consumption,.category-content>#artist-spotlight,.category-content>#artist-birthdays{margin-top:0}.category-content>#music-history-charts+.pmf-section{margin-top:0}@media(max-width:700px){.chart-category{margin-top:27px}.category-head h2{font-size:21px}.category-head p{font-size:11px}}
    `;d.head.appendChild(s)
  }
  function run(){style();organise();let n=0;const timer=setInterval(()=>{organise();if(++n>=50)clearInterval(timer)},120)}
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',run);else run();
})();
