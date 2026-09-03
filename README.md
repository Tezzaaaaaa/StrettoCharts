# StrettoCharts

Automated music-chart data updater and historical dataset.

## Sources

The updater currently collects:

- Spotify Global Daily
- Apple Music Global Top 100
- Apple Music Australia Top 100
- ARIA Top 50 Singles
- Billboard Hot 100

Each source is isolated. A source failure does not destroy successful updates from the other sources, and failed sources are recorded explicitly in `data/latest.json`.

## Run locally

Requires Node.js 22 or newer.

```bash
npm run update
```

The normalized output is written to `data/latest.json`.

## Automation

GitHub Actions runs the updater hourly and can also be started manually. Only changed chart data is committed.

## Data model

Every chart contains a source id, source URL, fetch timestamp, status, and normalized entries. Entries use a common shape where possible:

- `rank`
- `title`
- `artists`
- `streams` when the source supplies it
- source-specific chart metadata where available

The updater deliberately does not invent missing values.
