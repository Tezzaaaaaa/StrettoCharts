# StrettoCharts

Automated music-chart updater, historical archive and source-aware chart search.

## Live dashboard

**[Open the StrettoCharts live dashboard](https://tezzaaaaaa.github.io/StrettoCharts/)**

StrettoCharts is a lightweight, dependency-free HTML/CSS/JavaScript dashboard backed by the committed chart dataset. The product is intentionally search-first rather than a large analytics dashboard.

## Current experience

The page has one primary job: let a user search for an artist, song or album and see the chart performance actually present in the tracked data.

1. **Search** — search the local chart database from the main hero.
2. **Result selection** — autocomplete and fuzzy matching identify the intended artist, song or album.
3. **Profile** — the selected result becomes a focused profile showing current chart placements.
4. **Chart performance** — placements remain source-specific, with rank, movement, peak, weeks and chart date shown only when supplied by the source.
5. **Spotify artist tracking** — follow an artist locally without a Spotify account and open a Spotify-style artist view with monthly listeners, daily streams, total streams, listener peak, top songs, top albums and the artist's tracked chart footprint.
6. **Album context** — album searches can show matching track information when it exists in the data.
7. **Display** — one compact Day/Night control changes the display without introducing a separate UI system.

There are no separate dashboard sections for chart analytics, music-history charts, consumption charts, editorial modules, visual-aid demos or other legacy feature collections.

## Repository structure

```text
StrettoCharts/
├── index.html                 # GitHub Pages entry point
├── dashboard.html             # Search-first application and styles
├── search-enhancements.js     # Search, matching and result rendering
├── spotify-tracking.js        # Artist following and Spotify-style streaming metrics
├── package.json               # Minimal updater command
├── scripts/
│   └── update.mjs             # Chart-source update pipeline
├── data/
│   ├── latest.json            # Current committed chart snapshot
│   ├── spotify-artists.json   # Public Spotify artist metrics snapshot
│   ├── following.json         # Default artist watchlist
│   └── history/               # Date-stamped historical snapshots
└── .github/workflows/
    ├── pages.yml              # GitHub Pages deployment and validation
    ├── check.yml              # Pull-request and main-branch validation
    └── update.yml             # Scheduled/manual data updates
```

The repository deliberately contains only the files needed by the current product and data pipeline. UI behaviour is kept in the dashboard and search script; chart collection and persistence live in the updater.

## Chart data

Current chart sources are stored in `data/latest.json` and historical snapshots are stored under `data/history/`.

The dashboard keeps sources separate. It does not create an unofficial combined chart position from different methodologies, and it does not manufacture missing values.

Movement follows the source data where available. When calculated from ranks, a lower numerical rank is treated as an improvement (for example, #10 → #6).

## Search history loading

Current chart search is available immediately from `data/latest.json`. Historical snapshots are loaded only after a user selects an artist, song or album.

Before history loads, the selected profile shows its current chart placements and a loading state for history. If no historical snapshots exist, the profile reports that history is empty. If the history index or any snapshot cannot be loaded, current chart data remains visible and the profile reports that history could not be loaded; successfully retrieved historical snapshots remain usable when only part of the archive fails.

This lazy loading keeps the initial dashboard responsive as the historical archive grows without changing current-search behaviour.

## Automation

GitHub Actions runs the updater hourly and can also be started manually. The updater writes the current snapshot and date-stamped history only when the source data changes.

GitHub Pages publishes the repository directly. No Svelte, Vite build, component framework or frontend dependency is required by the current dashboard.

## Development

Requires Node.js 22+.

Run the data updater with:

```bash
npm run update
```

The dashboard itself is static and can be opened through GitHub Pages or served by any simple static HTTP server.

## Reliability rules

- Each chart source is handled independently.
- Missing values remain missing; StrettoCharts does not fabricate statistics.
- Platform and industry charts remain identifiable as separate sources.
- Historical snapshots are date-stamped.
- Search results are derived from the committed chart data, with external media metadata used only as supporting context when a strong match is available.

## Spotify-style artist tracking

StrettoCharts includes a Spotify-style tracking layer for users who do not have a Spotify account. The initial watchlist follows Lady Gaga. Following is stored locally in the browser, while the committed streaming snapshot is refreshed by the scheduled updater.

The streaming metrics are sourced from Kworb's public Spotify statistics pages and are explicitly labelled as third-party tracker data, not Spotify for Artists data. Spotify's own public documentation distinguishes chart-eligible streams from Spotify for Artists statistics, so StrettoCharts does not present the third-party figures as official Spotify analytics.

The artist view tracks:

- Monthly listeners and listener movement
- Monthly-listener peak
- Daily streams and all-time tracked streams
- Catalog track count
- Top songs by streams and daily streams
- Top albums by streams and daily streams
- Current StrettoCharts chart placements
- Follow/unfollow state and a persistent Following strip

The existing Spotify Global Daily and Spotify Global Weekly Top Songs sources remain source-specific chart data. No unofficial cross-platform rank is created.
