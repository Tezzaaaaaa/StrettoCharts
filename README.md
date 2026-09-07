# StrettoCharts

Automated music-chart updater, historical archive and source-aware chart intelligence dashboard.

## Live dashboard

**[Open the StrettoCharts live dashboard](https://tezzaaaaaa.github.io/StrettoCharts/)**

The dashboard is a Svelte application using Bits UI for accessible interaction primitives. It reads the committed `data/latest.json` and `data/history/` snapshots rather than inventing a separate dataset.

## Profile-first experience

Searching an artist, song, album or related media now produces a profile-style summary before the deeper analytics:

- automatically generated chart summary from the matched source rows
- best current position
- source coverage
- chart longevity
- movement interpretation
- matched songs for an artist
- album, genre, release-year and artwork metadata when a strong external media match is available
- separate presentation of external metadata so it is never confused with chart-source facts

The summary is deliberately factual. If the dataset does not contain a field, StrettoCharts does not manufacture it.

## Dashboard layout

The interface uses Bits UI primitives where they provide meaningful interaction structure:

- Tabs for Overview, Chart performance, and Sources & data
- Progress for loading state
- expandable/structured interaction primitives can be added without replacing the visual system because Bits UI is headless and styling remains controlled by StrettoCharts

The visual language uses large profile cards, editorial-style metadata blocks, responsive analytics panels, source-aware bars, movement indicators and compact ranking visuals rather than a generic admin dashboard.

## Chart interpretation

StrettoCharts keeps chart methodologies separate. Current rank, previous rank, movement, peak rank and weeks-on-chart are interpreted only from fields supplied by each source.

Movement rules:

- positive movement means the numerical rank improved, e.g. #10 → #6
- negative movement means the numerical rank worsened, e.g. #6 → #10
- `null` movement is not treated as a decline
- an explicit `movementLabel` from the source is preferred

Cross-source analytical scores normalize rank against each source's published entry count. These scores are explicitly StrettoCharts-derived and are not official chart rankings.

## Current chart coverage

### Streaming platforms

- Spotify Global Daily
- Spotify Global Viral 50
- Apple Music Global Top 100
- Apple Music Australia Top 100
- YouTube Global Top Songs Daily
- YouTube Global Top Songs Weekly
- YouTube Global Top Artists Weekly
- Deezer Global Top Tracks
- Shazam US Top 200

### Official / industry charts

- ARIA Top 50 Singles (Australia)
- Official UK Singles Top 100
- Billboard Hot 100
- Billboard Global 200

## Historical archive

Daily snapshots are stored under `data/history/` and indexed by `data/history/index.json`.

The dashboard refuses to fabricate a historical trend line when fewer than two dated snapshots exist. Once real snapshots accumulate, the same source-aware interpretation can be applied to historical charts.

## Automation

GitHub Actions runs the updater hourly and can also be started manually. It commits `data/latest.json` and new/changed history files only when data changes.

The Pages workflow builds the Svelte/Vite application and publishes the generated `dist/` directory.

## Local development

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Build the production dashboard with:

```bash
npm run build
```

Run the chart-data updater with:

```bash
npm run update
```

## Reliability rules

- Each chart source fails independently.
- Failed sources remain visible as source-health information.
- Missing values are represented as `null`; the updater and dashboard do not fabricate chart statistics.
- Chart movement is matched by normalized title + artist combination.
- Historical files are date-stamped.
- Platform charts and industry charts remain identifiable as separate sources.
- External media metadata is only displayed after a strong title/artist match.
