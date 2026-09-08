/* Editorial music-history charts built from documented Billboard milestones. */
(function(){
  const d=document;
  const DATA={
    leaders:[
      {decade:"1960s",artist:"The Beatles",value:18},
      {decade:"1970s",artist:"Bee Gees",value:9},
      {decade:"1980s",artist:"Michael Jackson",value:9},
      {decade:"1990s",artist:"Mariah Carey",value:14},
      {decade:"2000s",artist:"Usher",value:7},
      {decade:"2010s",artist:"Rihanna",value:9},
      {decade:"2020s",artist:"Drake",value:7}
    ],
    hiphop:[
      {artist:"Snoop Dogg",d90:2,d00:6,d10:3,d20:1,total:12},
      {artist:"JAY-Z",d90:2,d00:14,d10:5,d20:1,total:22},
      {artist:"Drake",d90:0,d00:0,d10:20,d20:null,total:20}
    ],
    longevity:[
      {artist:"Snoop Dogg",years:28.7},
      {artist:"JAY-Z",years:24.5}
    ],
    popLongevity:[
      {artist:"Michael Jackson",decades:5},
      {artist:"Mariah Carey",decades:4},
      {artist:"Madonna",decades:4},
      {artist:"Britney Spears",decades:4},
      {artist:"Elton John",decades:4}
    ]
  };
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  function barChart(title,sub,rows,max,formatter){
    const w=760,h=300,p={l:48,r:24,t:34,b:58},innerW=w-p.l-p.r,innerH=h-p.t-p.b,gap=12,bw=Math.max(28,(innerW-gap*(rows.length-1))/rows.length);
    const bars=rows.map((r,i)=>{const v=r.value||0,bh=(v/max)*innerH,x=p.l+i*(bw+gap),y=h-p.b-bh;return `<g><title>${esc(r.artist||r.decade)}: ${formatter(v)}</title><rect class="mhi-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="9"></rect><text class="mhi-value" x="${(x+bw/2).toFixed(1)}" y="${Math.max(y-9,16).toFixed(1)}" text-anchor="middle">${formatter(v)}</text><text class="mhi-label" x="${(x+bw/2).toFixed(1)}" y="${h-28}" text-anchor="middle">${esc(r.decade||r.artist)}</text></g>`}).join('');
    return `<article class="mhi-card"><div class="mhi-head"><div><h3>${esc(title)}</h3><p>${esc(sub)}</p></div><strong>${rows.length}</strong></div><svg class="mhi-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><line class="mhi-axis" x1="${p.l}" y1="${h-p.b}" x2="${w-p.r}" y2="${h-p.b}"></line>${bars}</svg></article>`;
  }
  function hipHop(){
    const decades=[['90s','d90'],['00s','d00'],['10s','d10'],['20s','d20']];
    const max=14,w=760,h=320,p={l:52,r:24,t:40,b:60},innerW=w-p.l-p.r,groupW=innerW/decades.length,bw=46,gap=10;
    const bars=decades.map(([label,key],i)=>{const groupX=p.l+i*groupW;return `<g><text class="mhi-label" x="${groupX+groupW/2}" y="${h-27}" text-anchor="middle">${label}</text>${DATA.hiphop.map((r,j)=>{const v=r[key],x=groupX+(groupW-(DATA.hiphop.length*bw+(DATA.hiphop.length-1)*gap))/2+j*(bw+gap);if(v==null)return '';const bh=(v/max)*(h-p.t-p.b),y=h-p.b-bh;return `<rect class="mhi-bar mhi-bar-${j}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${bh.toFixed(1)}" rx="8"><title>${esc(r.artist)}: ${v} top-10 hits</title></rect><text class="mhi-value" x="${x+bw/2}" y="${Math.max(y-7,15)}" text-anchor="middle">${v}</text>`}).join('')}</g>`}).join('');
    return `<article class="mhi-card mhi-wide"><div class="mhi-head"><div><h3>Hip-hop longevity by decade</h3><p>Billboard Hot 100 top-10 hits: a quick look at how long rap's biggest names kept returning to the upper tier.</p></div><strong>90s → 20s</strong></div><svg class="mhi-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Hip-hop top ten hits by decade"><line class="mhi-axis" x1="${p.l}" y1="${h-p.b}" x2="${w-p.r}" y2="${h-p.b}"></line>${bars}</svg><div class="mhi-legend">${DATA.hiphop.map((r,i)=>`<span><i class="mhi-key mhi-bar-${i}"></i>${esc(r.artist)}</span>`).join('')}</div></article>`;
  }
  function render(){
    if(d.querySelector('#music-history-charts'))return;
    const analytics=d.querySelector('#analytics');if(!analytics)return;
    const host=d.createElement('section');host.id='music-history-charts';host.className='mhi-section';
    const leaderRows=DATA.leaders.map(x=>({decade:x.decade,artist:x.artist,value:x.value}));
    const popRows=DATA.popLongevity.map(x=>({artist:x.artist,value:x.decades}));
    host.innerHTML=`<div class="head"><div><h2>Music history: the fun stuff</h2><p>Historical Billboard benchmarks layered onto the live StrettoCharts dashboard.</p></div></div><div class="mhi-grid">${barChart('Hot 100 No. 1 kings by decade','The artist with the most Billboard Hot 100 No. 1s in each decade.',leaderRows,18,v=>String(v))}${hipHop()}${barChart('Pop longevity hall of fame','Artists with Hot 100 top-10 hits across four or more distinct decades.',popRows,5,v=>`${v} decades`)}<article class="mhi-card"><div class="mhi-head"><div><h3>Longest-running rap eras</h3><p>Span of Hot 100 top-10 appearances among the longest-running rappers documented in the benchmark.</p></div><strong>Years</strong></div><div class="mhi-ranks">${DATA.longevity.map((x,i)=>`<div class="mhi-rank"><b>${i+1}</b><span>${esc(x.artist)}</span><strong>${x.years.toFixed(1)}</strong><small>years of top-10 presence</small></div>`).join('')}</div></article></div><div class="mhi-source">Historical benchmarks: Billboard chart retrospectives and chart-history reporting. The decade leader figures are No. 1 counts; hip-hop and longevity figures use documented Hot 100 top-10 milestones.</div>`;
    analytics.insertAdjacentElement('afterend',host);
    const s=d.createElement('style');s.id='music-history-charts-css';s.textContent=`.mhi-section{margin-top:30px}.mhi-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.mhi-card{background:#fff;border:1px solid #e4e4ed;border-radius:23px;padding:20px;box-shadow:0 8px 28px #24243b0d;min-width:0}.mhi-wide{grid-column:1/-1}.mhi-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px}.mhi-head h3{margin:0;font-size:17px}.mhi-head p{margin:5px 0 0;color:#717282;font-size:10px;line-height:1.5}.mhi-head>strong{font-size:18px;white-space:nowrap}.mhi-svg{width:100%;height:auto;display:block}.mhi-axis{stroke:#d6d6de;stroke-width:1}.mhi-bar{fill:#7657ff}.mhi-bar-1{fill:#ff3d81}.mhi-bar-2{fill:#19a7ff}.mhi-value{font-size:10px;font-weight:850;fill:#171722}.mhi-label{font-size:10px;fill:#717282}.mhi-legend{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-top:2px;font-size:10px;color:#555565}.mhi-legend span{display:inline-flex;align-items:center;gap:5px}.mhi-key{width:9px;height:9px;border-radius:50%;display:inline-block;background:#7657ff}.mhi-key.mhi-bar-1{background:#ff3d81}.mhi-key.mhi-bar-2{background:#19a7ff}.mhi-ranks{display:grid;gap:10px}.mhi-rank{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;padding:12px;border-radius:15px;background:#f8f8fc}.mhi-rank>b{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:linear-gradient(135deg,#ff3d81,#7657ff);color:#fff}.mhi-rank span{font-size:12px;font-weight:800}.mhi-rank strong{font-size:21px}.mhi-rank small{grid-column:2/-1;color:#717282;font-size:9px}.mhi-source{margin-top:9px;color:#858595;font-size:9px;line-height:1.5}@media(max-width:900px){.mhi-grid{grid-template-columns:1fr}.mhi-wide{grid-column:auto}}@media(max-width:700px){.mhi-card{padding:15px}.mhi-head h3{font-size:15px}.mhi-value,.mhi-label{font-size:9px}}`;d.head.appendChild(s);
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',()=>setTimeout(render,350));else setTimeout(render,350);
})();