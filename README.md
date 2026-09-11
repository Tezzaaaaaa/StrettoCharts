# StrettoCharts

Automated music-chart updater, historical archive and source-aware chart search.

## Live dashboard

**[Open the StrettoCharts live dashboard](https://tezzaaaaaa.github.io/StrettoCharts/)**

StrettoCharts is a lightweight, dependency-free HTML/CSS/JavaScript dashboard backed by the committed chart dataset. The current product is intentionally search-first rather than a large analytics dashboard.

## Current experience

The page has one primary job: let a user search for an artist, song or album and see the chart performance that is actually present in the tracked data.

1. **Search** — search the local chart database from the main hero.
2. **Result selection** — autocomplete and fuzzy matching help identify the intended artist, song or album.
3. **Profile** — the selected result becomes a focused profile showing its current chart placements.
4. **Chart performance** — placements remain source-specific, with rank, movement, peak, weeks and chart date shown only when supplied by the source.
5. **Album context** — album searches can show matching track information when it exists in the data.
6. **Theme** — the fixed Day/Night control changes the display without introducing a separate theme system.

There are no separate dashboard sections for chart analytics, music-history charts, consumption charts, editorial modules, visual-aid demos or other legacy feature collections. Those were removed from the active product structure so the interface stays focused.

## Repository structure

```text
StrettoCharts/
├── index.html                 # GitHub Pages entry point
├── dashboard.html             # Search-first application UI
├── search-enhancements.js     # Local search, matching and result rendering
├── controls.js                # Theme/display controls
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

The repository deliberately does not retain old presentation layers or competing implementations. UI behaviour that belongs to the current dashboard lives in the two active browser scripts; chart collection and persistence live in the updater.

## Chart data

Current chart sources are stored in `data/latest.json` and historical snapshots are stored under `data/history/`.

The dashboard keeps sources separate. It does not create an unofficial combined chart position from different methodologies, and it does not manufacture missing values.

Movement follows the source data where available. When calculated from ranks, a lower numerical rank is treated as an improvement (for example, #10 → #6).

## Automation

GitHub Actions runs the updater on schedule and can also be started manually. The updater writes the current snapshot and date-stamped history only when the source data changes.

GitHub Pages publishes the repository directly. No Svelte, Vite build, component framework or frontend dependency is required by the current dashboard.

## Development

Requires Node.js 22+.

Install the repository and run the data updater with:

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
