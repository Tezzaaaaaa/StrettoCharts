# StrettoCharts

Automated music-chart updater, historical archive and cross-chart ranking engine.

## Current charts

- Spotify Global Daily
- Apple Music Global Top 100
- Apple Music Australia Top 100
- ARIA Top 50 Singles
- Billboard Hot 100

Spotify describes its charts as daily listener-driven streaming charts, while Apple Music's Global Top 100 is explicitly updated every day. citeturn0news0turn0search3

## What StrettoCharts tracks

Every successful update produces normalized chart entries with:

- current rank
- previous rank
- movement (`up`, `down`, `same`, or `new`)
- peak rank
- weeks on chart
- title and artists
- streams where supplied by the source
- album/artwork/link metadata where supplied

The updater also builds a cross-source **Artist Rankings** table using rank-weighted points and appearance counts.

## Historical archive

Daily snapshots are stored under `data/history/` and indexed by `data/history/index.json`. `data/latest.json` is always the most recent successful/partial update.

This makes it possible to calculate long-term chart history instead of relying on today's page alone.

## Automation

GitHub Actions runs hourly and can also be started manually. It commits `data/latest.json` and any new/changed history files only when the data changes.

## Local use

Requires Node.js 22+.

```bash
npm run update
```

## Reliability rules

- Each chart source fails independently.
- A failed source is recorded rather than silently omitted.
- Missing values are represented as `null`; the updater does not fabricate chart statistics.
- Chart movement is matched by normalized title + artist combination.
- Historical files are date-stamped so the dataset can be consumed by a future dashboard/API.
