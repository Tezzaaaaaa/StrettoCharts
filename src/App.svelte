<script>
  import { onMount } from 'svelte';
  import { Accordion, Progress, Tabs } from 'bits-ui';

  let data = null;
  let query = '';
  let confirmedQuery = '';
  let loading = true;
  let enrichment = null;
  let historyDates = [];
  let activeTab = 'overview';

  const esc = (value) => String(value ?? '');
  const norm = (value) => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sourceEntries = (source) => (source.entries || []).map((entry) => ({ ...entry, source: source.name, status: source.status, sourceCount: source.count || source.entries?.length || 0 }));
  const all = () => data?.sources?.flatMap(sourceEntries) || [];
  const good = () => all().filter((entry) => entry.status === 'ok' && Number.isFinite(Number(entry.rank)));
  const sources = () => data?.sources || [];
  const movementValue = (entry) => {
    if (Number.isFinite(Number(entry.movement))) return Number(entry.movement);
    if (Number.isFinite(Number(entry.previousRank)) && Number.isFinite(Number(entry.rank))) return Number(entry.previousRank) - Number(entry.rank);
    return null;
  };
  const movementLabel = (entry) => {
    const value = movementValue(entry);
    if (entry.movementLabel) return entry.movementLabel;
    if (value === null) return 'New / no prior rank';
    if (value > 0) return `Up ${value}`;
    if (value < 0) return `Down ${Math.abs(value)}`;
    return 'Holding';
  };
  const movementClass = (entry) => {
    const value = movementValue(entry);
    if (value === null) return 'new';
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'flat';
  };
  const rankScore = (entry) => {
    const count = Number(entry.sourceCount) || 1;
    const rank = Number(entry.rank);
    return count <= 1 ? 1 : Math.max(0, Math.min(1, 1 - (rank - 1) / (count - 1)));
  };
  const groups = (entries) => {
    const map = new Map();
    entries.forEach((entry) => {
      const key = `${norm(entry.title)}::${norm((entry.artists || []).join('|'))}`;
      if (!map.has(key)) map.set(key, { title: entry.title, artists: entry.artists || [], entries: [] });
      map.get(key).entries.push(entry);
    });
    return [...map.values()];
  };
  const filteredGroups = () => {
    const needle = norm(confirmedQuery);
    if (!needle) return groups(good()).sort((a, b) => Math.min(...a.entries.map((e) => e.rank)) - Math.min(...b.entries.map((e) => e.rank))).slice(0, 8);
    return groups(good()).filter((group) => norm(group.title).includes(needle) || group.artists.some((artist) => norm(artist).includes(needle))).sort((a, b) => Math.min(...a.entries.map((e) => e.rank)) - Math.min(...b.entries.map((e) => e.rank))).slice(0, 16);
  };
  const artistMatches = () => {
    const needle = norm(confirmedQuery);
    return [...new Set(good().flatMap((entry) => entry.artists || []).filter((artist) => norm(artist).includes(needle)))].sort((a, b) => a.length - b.length);
  };
  const selectedArtist = () => artistMatches()[0] || filteredGroups()[0]?.artists?.[0] || '';
  const artistEntries = () => {
    const artist = norm(selectedArtist());
    return good().filter((entry) => (entry.artists || []).some((name) => norm(name) === artist));
  };
  const topArtists = () => {
    const map = new Map();
    good().forEach((entry) => (entry.artists || []).forEach((artist) => {
      const current = map.get(artist) || { artist, score: 0, songs: 0, best: Infinity, sources: new Set() };
      current.score += rankScore(entry);
      current.songs += 1;
      current.best = Math.min(current.best, Number(entry.rank));
      current.sources.add(entry.source);
      map.set(artist, current);
    }));
    return [...map.values()].sort((a, b) => b.score - a.score).slice(0, 6).map((item) => ({ ...item, sources: item.sources.size }));
  };
  const movementCounts = (entries = good()) => ({
    up: entries.filter((e) => movementValue(e) > 0).length,
    down: entries.filter((e) => movementValue(e) < 0).length,
    holding: entries.filter((e) => movementValue(e) === 0).length,
    new: entries.filter((e) => movementValue(e) === null).length
  });
  const bestRank = (entries) => entries.length ? Math.min(...entries.map((e) => Number(e.rank))) : null;
  const longest = (entries) => entries.filter((e) => Number.isFinite(Number(e.weeksOnChart))).sort((a, b) => Number(b.weeksOnChart) - Number(a.weeksOnChart))[0];
  const maxWeeks = (entries) => Math.max(1, ...entries.map((e) => Number(e.weeksOnChart) || 0));
  const currentProfile = () => {
    const entries = artistEntries();
    const artist = selectedArtist();
    if (!artist || !confirmedQuery) return null;
    return { artist, entries, songs: groups(entries), best: bestRank(entries), sources: new Set(entries.map((e) => e.source)).size, longest: longest(entries) };
  };

  function summaryText(profile, song = null) {
    if (song) {
      const best = Math.min(...song.entries.map((e) => Number(e.rank)));
      const longestSong = song.entries.filter((e) => Number.isFinite(Number(e.weeksOnChart))).sort((a, b) => Number(b.weeksOnChart) - Number(a.weeksOnChart))[0];
      const sourceCount = song.entries.length;
      const peak = Math.min(...song.entries.map((e) => Number(e.peakRank)).filter(Number.isFinite));
      const movement = song.entries.map(movementValue).filter((v) => v !== null);
      const movementSentence = movement.length ? `Across the available source rows, its reported movement ranges from ${Math.min(...movement)} to ${Math.max(...movement)} positions.` : 'No comparable previous position is available in the current snapshot, so movement is not inferred.';
      return `${song.title} is currently represented by ${sourceCount} chart source${sourceCount === 1 ? '' : 's'}, with a best current position of #${best}. ${Number.isFinite(peak) ? `Its best supplied peak is #${peak}. ` : ''}${longestSong ? `The longest supplied chart tenure for this result is ${longestSong.weeksOnChart} weeks on ${longestSong.source}. ` : ''}${movementSentence}`;
    }
    const score = profile.entries.reduce((sum, entry) => sum + rankScore(entry), 0);
    return `${profile.artist} is currently represented by ${profile.songs.length} distinct song result${profile.songs.length === 1 ? '' : 's'} across ${profile.sources} active chart source${profile.sources === 1 ? '' : 's'}. The best current position is ${profile.best ? `#${profile.best}` : 'not available'}, while the normalized StrettoCharts score is ${score.toFixed(2)}. ${profile.longest ? `The longest supplied chart tenure among the matched entries is ${profile.longest.weeksOnChart} weeks on ${profile.longest.source}.` : 'No chart-tenure value is supplied for the matched entries.'}`;
  }

  async function enrichSong(song) {
    if (!song) return null;
    const artist = song.artists?.[0] || '';
    try {
      const term = encodeURIComponent(`${song.title} ${artist}`);
      const response = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=8`);
      if (!response.ok) return null;
      const json = await response.json();
      const targetTitle = norm(song.title).replace(/\s*\([^)]*\)/g, '').trim();
      const targetArtist = norm(artist);
      const match = (json.results || []).map((item) => ({
        item,
        score: (norm(item.trackName) === targetTitle ? 3 : norm(item.trackName).includes(targetTitle) || targetTitle.includes(norm(item.trackName)) ? 1 : 0) + (norm(item.artistName) === targetArtist ? 3 : norm(item.artistName).includes(targetArtist) ? 1 : 0)
      })).sort((a, b) => b.score - a.score)[0];
      if (!match || match.score < 4) return null;
      return match.item;
    } catch {
      return null;
    }
  }

  async function runSearch() {
    confirmedQuery = query.trim();
    enrichment = null;
    activeTab = 'overview';
    const first = filteredGroups()[0];
    if (first) enrichment = await enrichSong(first);
  }

  async function load() {
    loading = true;
    try {
      const response = await fetch('./data/latest.json', { cache: 'no-store' });
      data = await response.json();
      const historyResponse = await fetch('./data/history/index.json', { cache: 'no-store' });
      historyDates = await historyResponse.json();
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  });

  $: profile = currentProfile();
  $: results = filteredGroups();
  $: leaders = results.slice(0, 6);
  $: movement = movementCounts(profile?.entries || good());
  $: totalMovement = Math.max(1, Object.values(movement).reduce((a, b) => a + b, 0));
  $: freshness = data?.generatedAt ? `${Math.max(0, Math.round((Date.now() - new Date(data.generatedAt).getTime()) / 60000))}m` : '—';
</script>

<svelte:head>
  <title>StrettoCharts — Music Chart Intelligence</title>
  <meta name="description" content="Search songs and artists, then explore source-aware chart performance and automatically generated profiles." />
</svelte:head>

<main class="shell">
  <section class="hero">
    <div class="hero-orb orb-a"></div><div class="hero-orb orb-b"></div>
    <div class="eyebrow">Live chart intelligence</div>
    <div class="brand">StrettoCharts</div>
    <p class="hero-copy">A modern profile and analytics view for chart data. Search a song or artist and StrettoCharts builds a concise profile first, then exposes the underlying positions, movement, longevity and source coverage.</p>
    <form class="searchbar" onsubmit={(event) => { event.preventDefault(); runSearch(); }}>
      <input bind:value={query} aria-label="Search artist or song" placeholder="Search an artist, song, album or media…" />
      <button type="submit">Search</button>
    </form>
    <div class="updated">{data?.generatedAt ? `Dataset generated ${new Date(data.generatedAt).toLocaleString()}` : 'Loading latest dataset…'}</div>
  </section>

  <section class="metrics">
    <div class="metric"><strong>{sources().length}</strong><span>chart sources</span></div>
    <div class="metric"><strong>{good().length}</strong><span>current entries</span></div>
    <div class="metric"><strong>{new Set(good().flatMap((e) => e.artists || [])).size}</strong><span>artists indexed</span></div>
    <div class="metric"><strong>{historyDates.length}</strong><span>snapshots</span></div>
    <div class="metric"><strong>{sources().length ? Math.round((sources().filter((s) => s.status === 'ok').length / sources().length) * 100) : 0}%</strong><span>source health</span></div>
    <div class="metric"><strong>{freshness}</strong><span>data age</span></div>
  </section>

  {#if loading}
    <div class="loading-card"><Progress.Root value={65} max={100} aria-label="Loading chart data"><div class="progress-fill"></div></Progress.Root><span>Loading chart intelligence…</span></div>
  {:else}
    <section class="section">
      <div class="section-heading"><div><div class="kicker">{confirmedQuery ? 'Search result' : 'Today'}</div><h2>{confirmedQuery ? `Profile for “${confirmedQuery}”` : 'Current chart leaders'}</h2><p>{confirmedQuery ? 'The profile is generated from the matched chart rows, with external metadata shown only when a strong metadata match is available.' : 'Start with the strongest current positions, then search for a specific profile.'}</p></div></div>

      {#if profile}
        <div class="profile-hero">
          <div class="profile-art-wrap">
            {#if enrichment?.artworkUrl100}<img src={enrichment.artworkUrl100.replace('100x100', '600x600')} alt="" class="profile-art" />{:else}<div class="profile-art placeholder-art">{profile.artist.slice(0,1)}</div>{/if}
          </div>
          <div class="profile-copy">
            <div class="pill">Confirmed chart profile</div>
            <h1>{profile.artist}</h1>
            <p>{summaryText(profile)}</p>
            <div class="profile-stats"><span><b>{profile.songs.length}</b> songs</span><span><b>{profile.sources}</b> sources</span><span><b>{profile.best ? `#${profile.best}` : '—'}</b> best position</span><span><b>{profile.longest?.weeksOnChart ?? '—'}</b> longest weeks</span></div>
          </div>
          {#if enrichment}
            <div class="metadata-card"><span>Metadata match</span><strong>{enrichment.collectionName || 'Single / track'}</strong><small>{enrichment.primaryGenreName || 'Music'}{enrichment.releaseDate ? ` · ${new Date(enrichment.releaseDate).getFullYear()}` : ''}</small>{#if enrichment.trackViewUrl}<a href={enrichment.trackViewUrl} target="_blank" rel="noreferrer">Open media metadata ↗</a>{/if}</div>
          {/if}
        </div>

        <Tabs.Root bind:value={activeTab} class="tabs-root">
          <Tabs.List class="tabs-list" aria-label="Profile sections">
            <Tabs.Trigger class="tab" value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger class="tab" value="performance">Chart performance</Tabs.Trigger>
            <Tabs.Trigger class="tab" value="sources">Sources & data</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="overview" class="tab-panel">
            <div class="grid-2">
              <div class="card"><div class="card-title">Matched songs</div><div class="card-sub">The current snapshot rows used to build this profile.</div><div class="song-list">{#each profile.songs.slice(0,8) as song}<div class="song-row"><div><strong>{song.title}</strong><span>{song.entries.length} source{song.entries.length === 1 ? '' : 's'} · best #{Math.min(...song.entries.map((e) => e.rank))}</span></div><b>{Math.max(...song.entries.map((e) => e.weeksOnChart || 0)) || '—'}w</b></div>{/each}</div></div>
              <div class="card"><div class="card-title">Profile interpretation</div><div class="card-sub">A plain-language summary generated only from supplied chart facts.</div><p class="summary">{summaryText(profile)}</p><div class="notice">StrettoCharts does not invent a biography, album, genre or release date. External metadata is displayed separately and only after a strong match.</div></div>
            </div>
          </Tabs.Content>
          <Tabs.Content value="performance" class="tab-panel">
            <div class="grid-2">
              <div class="card"><div class="card-title">Current position by source</div><div class="card-sub">Lower rank number means a stronger chart position.</div><div class="bar-chart">{#each profile.entries.sort((a,b) => a.rank-b.rank) as entry}<div class="bar-row"><div class="bar-label"><span>{entry.source}</span><small>#{entry.rank}</small></div><div class="track"><i style={`width:${Math.max(5, rankScore(entry)*100)}%`}></i></div></div>{/each}</div></div>
              <div class="card"><div class="card-title">Movement profile</div><div class="card-sub">Only explicit or safely derived movement is counted.</div><div class="donut" style={`--up:${movement.up/totalMovement*100}%;--down:${movement.down/totalMovement*100}%;--new:${movement.new/totalMovement*100}%`}></div><div class="legend"><span><i class="dot up-dot"></i>Up <b>{movement.up}</b></span><span><i class="dot down-dot"></i>Down <b>{movement.down}</b></span><span><i class="dot new-dot"></i>New / unavailable <b>{movement.new}</b></span><span><i class="dot hold-dot"></i>Holding <b>{movement.holding}</b></span></div></div>
            </div>
          </Tabs.Content>
          <Tabs.Content value="sources" class="tab-panel">
            <div class="grid-2"><div class="card"><div class="card-title">Source rows</div>{#each profile.entries as entry}<div class="source-row"><div><strong>{entry.source}</strong><span>rank #{entry.rank} · peak #{entry.peakRank ?? '—'} · {entry.weeksOnChart ?? '—'} weeks</span></div><span class={`movement ${movementClass(entry)}`}>{movementLabel(entry)}</span></div>{/each}</div><div class="card"><div class="card-title">Data rules</div><div class="rules"><span>✓ Missing movement is never treated as a decline.</span><span>✓ Source entry counts determine normalized position scoring.</span><span>✓ Different chart methodologies are not averaged into an invented official rank.</span><span>✓ Historical trends appear only when real dated snapshots exist.</span></div></div></div>
          </Tabs.Content>
        </Tabs.Root>
      {:else}
        <div class="results-grid">{#each leaders as song}<article class="result-card"><div class="result-main"><div class="cover placeholder-art">{song.title.slice(0,1)}</div><div><div class="result-title">{song.title}</div><div class="result-artist">{song.artists.join(', ')}</div><div class="result-summary">{summaryText(null, song)}</div></div></div><div class="mini-chart">{#each song.entries as entry}<div class="mini-row"><span>{entry.source}</span><b>#{entry.rank}</b><em class={`movement ${movementClass(entry)}`}>{movementLabel(entry)}</em></div>{/each}</div></article>{/each}</div>
      {/if}
    </section>

    <section class="section">
      <div class="section-heading"><div><div class="kicker">Analytics</div><h2>{profile ? 'Profile analytics' : 'Dataset analytics'}</h2><p>Visuals remain tied to the actual snapshot and keep source definitions separate.</p></div></div>
      <div class="analytics-grid">
        <div class="card wide"><div class="card-title">Top artists by normalized cross-source score</div><div class="card-sub">A StrettoCharts-derived analytical score, not an official chart.</div><div class="rank-list">{#each topArtists() as item, index}<div class="rank-row"><b>{index+1}</b><span>{item.artist}<small>{item.songs} songs · {item.sources} sources · best #{item.best}</small></span><strong>{item.score.toFixed(2)}</strong><div class="track"><i style={`width:${Math.min(100, item.score / Math.max(1, topArtists()[0]?.score) * 100)}%`}></i></div></div>{/each}</div></div>
        <div class="card"><div class="card-title">Movement mix</div><div class="card-sub">Current dataset classification.</div><div class="mix-bars">{#each Object.entries(movement) as pair}<div><span>{pair[0]}</span><div class="track"><i style={`width:${pair[1]/totalMovement*100}%`}></i></div><b>{pair[1]}</b></div>{/each}</div></div>
      </div>
    </section>

    <section class="section">
      <div class="section-heading"><div><div class="kicker">Data integrity</div><h2>Chart coverage & source health</h2><p>Unavailable sources remain visible as source health information but are excluded from performance calculations.</p></div></div>
      <div class="source-grid">{#each sources() as source}<div class="source-card"><span class:bad={source.status !== 'ok'} class="health-dot"></span><strong>{source.name}</strong><small>{source.status === 'ok' ? `${source.count || source.entries?.length || 0} entries` : 'Unavailable'}</small><span class="source-type">{source.type || 'chart'}</span></div>{/each}</div>
      {#if historyDates.length < 2}<div class="notice large">Historical trend graphs are intentionally not fabricated: this dataset currently contains {historyDates.length} dated snapshot{historyDates.length === 1 ? '' : 's'}, which is not enough to draw a legitimate time series.</div>{/if}
    </section>
  {/if}

  <footer>StrettoCharts · source-aware chart intelligence · missing values are never fabricated</footer>
</main>
