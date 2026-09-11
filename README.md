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
5. **Album context** — album searches can show matching track information when it exists in the data.
6. **Display** — one compact Day/Night control changes the display without introducing a separate UI system.

There are no separate dashboard sections for chart analytics, music-history charts, consumption charts, editorial modules, visual-aid demos or other legacy feature collections.

## Repository structure

```text
StrettoCharts/
├── index.html                 # GitHub Pages entry point
├── dashboard.html             # Search-first application and styles
├── search-enhancements.js     # Search, matching and result rendering
├── package.json               # Minimal updater command
├── scripts/
│   └── update.mjs             # Chart-source update pipeline
├── data/
│   ├── latest.json            # Current committed chart snapshot
│   └── history/               # Date-stamped historical snapshots
└── .github/workflows/
    ├── pages.yml              # GitHub Pages deployment
    └── update.yml             # Scheduled/manual data updates
```

The repository deliberately contains only the files needed by the current product and data pipeline. UI behaviour is kept in the dashboard and search script; chart collection and persistence live in the updater.

## Chart data

Current chart sources are stored in `data/latest.json` and historical snapshots are stored under `data/history/`.

The dashboard keeps sources separate. It does not create an unofficial combined chart position from different methodologies, and it does not manufacture missing values.

Movement follows the source data where available. When calculated from ranks, a lower numerical rank is treated as an improvement (for example, #10 → #6).

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
