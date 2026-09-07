/* Search-result enrichment: show album context for songs/artists without misclassifying the selected result. */
(function(){
  const d=document,$=s=>d.querySelector(s),esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  let lastKey='';
  async function iTunesSearch(term,entity,limit=10){try{const r=await fetch('https://itunes.apple.com/search?term='+encodeURIComponent(term)+'&media=music&entity='+entity+'&limit='+limit+'&country=AU',{signal:AbortSignal.timeout(5000)});if(!r.ok)return[];const j=await r.json();return j.results||[]}catch(_){return[]}}
  async function enrich(){
    const profile=$('.profile');if(!profile)return;
    const kind=profile.querySelector('.profile-kind')?.textContent.replace(/\s*profile\s*$/i,'').trim()||'';
    const name=profile.querySelector('.profile-name')?.textContent.trim()||'';
    if(!kind||!name)return;
    const key=kind+'::'+norm(name);if(key===lastKey)return;lastKey=key;
    /* The selected type is authoritative. Do not let album/song metadata change an Artist result into another type. */
    const type=profile.querySelector('.profile-kind');if(type)type.textContent=kind+' profile';
    if(kind==='Artist'){
      const results=await iTunesSearch(name,'musicArtist',5);const artist=results.find(x=>norm(x.artistName)===norm(name))||results[0];
      if(!artist?.artistId)return;
      const albums=await (async()=>{try{const r=await fetch('https://itunes.apple.com/lookup?id='+encodeURIComponent(artist.artistId)+'&entity=album&limit=50&country=AU',{signal:AbortSignal.timeout(5000)});if(!r.ok)return[];const j=await r.json();return(j.results||[]).filter(x=>x.collectionType==='Album')}catch(_){return[]}})();
      if(!albums.length)return;
      const section=d.createElement('section');section.className='search-album-context';
      section.innerHTML='<h3>Albums</h3><p class="search-album-sub">Album information for this artist, including albums that are not currently charting.</p><div class="search-album-grid">'+albums.slice(0,12).map(a=>'<article class="search-album-card"><img src="'+esc(a.artworkUrl100||'')+'" alt="" loading="lazy"><div><strong>'+esc(a.collectionName||'')+'</strong><span>'+esc(a.releaseDate?new Date(a.releaseDate).getFullYear():'')+(a.trackCount?' · '+a.trackCount+' tracks':'')+'</span><small>Not charting in tracked sources unless shown in the chart placements above.</small></div></article>').join('')+'</div>';
      profile.parentNode.insertBefore(section,profile.nextSibling);
      const stats=profile.querySelectorAll('.profile-stat');stats.forEach(x=>{const label=x.querySelector('span')?.textContent||'';if(/album tracks/i.test(label)){x.querySelector('strong').textContent=albums.length;x.querySelector('span').textContent='albums';}});
    } else if(kind==='Song'){
      const summary=profile.querySelector('.profile-summary')?.textContent||'';
      const artist=(summary.match(/\sby\s(.+?)\s—/)||[])[1]||'';
      const results=await iTunesSearch(name+(artist?' '+artist:''),'song',8);const song=results.find(x=>norm(x.trackName)===norm(name)&&( !artist||norm(x.artistName)===norm(artist)))||results.find(x=>norm(x.trackName)===norm(name));
      if(!song?.collectionName)return;
      const section=d.createElement('section');section.className='search-album-context';section.innerHTML='<h3>Album</h3><div class="search-album-feature"><img src="'+esc(song.artworkUrl100||'')+'" alt="" loading="lazy"><div><strong>'+esc(song.collectionName)+'</strong><span>'+esc(song.artistName||artist)+(song.releaseDate?' · '+new Date(song.releaseDate).getFullYear():'')+(song.trackCount?' · '+song.trackCount+' tracks':'')+'</span><small>This album is shown as release context whether or not the album itself is currently charting.</small></div></div>';
      profile.parentNode.insertBefore(section,profile.nextSibling);
    }
  }
  function style(){const s=d.createElement('style');s.textContent='.search-album-context{margin-top:13px;padding:20px;background:#fff;border:1px solid #e4e4ed;border-radius:23px;box-shadow:0 8px 28px #24243b0d}.search-album-context h3{margin:0;font-size:17px}.search-album-sub{margin:5px 0 14px;color:#717282;font-size:11px}.search-album-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.search-album-card{display:grid;grid-template-columns:58px 1fr;gap:10px;align-items:center;padding:9px;border-radius:15px;background:#f8f8fc}.search-album-card img,.search-album-feature img{width:58px;height:58px;border-radius:12px;object-fit:cover;background:#ececf3}.search-album-card strong,.search-album-feature strong{display:block;font-size:12px}.search-album-card span,.search-album-feature span{display:block;margin-top:3px;color:#717282;font-size:9px}.search-album-card small,.search-album-feature small{display:block;margin-top:4px;color:#717282;font-size:8px;line-height:1.35}.search-album-feature{display:grid;grid-template-columns:82px 1fr;gap:14px;align-items:center;margin-top:13px;padding:11px;border-radius:16px;background:#f8f8fc}.search-album-feature img{width:82px;height:82px}@media(max-width:700px){.search-album-grid{grid-template-columns:1fr 1fr}}@media(max-width:480px){.search-album-grid{grid-template-columns:1fr}.search-album-feature{grid-template-columns:68px 1fr}.search-album-feature img{width:68px;height:68px}}';d.head.appendChild(s)}
  function init(){style();new MutationObserver(()=>enrich()).observe(d.body,{childList:true,subtree:true});enrich()}
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})();
