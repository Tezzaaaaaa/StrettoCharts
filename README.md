# StrettoCharts

Automated music-chart updater, historical archive and cross-chart ranking engine.

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

Sources are intentionally separated: a source can fail or change markup without taking down the rest of the update. YouTube publishes daily and weekly music charts, including Top Songs, Top Artists and Top Music Videos; its charts are based on platform view activity. Apple exposes catalog chart data through its music services, while Deezer exposes a global chart tracks endpoint. The Official Charts Company and Billboard provide industry charts that complement streaming-platform signals.

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

The updater also builds a cross-source **Artist Rankings** table using rank-weighted points and appearance counts. This is a StrettoCharts composite ranking, not an official platform ranking.

## Historical archive

Daily snapshots are stored under `data/history/` and indexed by `data/history/index.json`. `data/latest.json` is always the most recent successful/partial update.

This makes it possible to calculate long-term chart history instead of relying on today's page alone.

## Automation

GitHub Actions runs hourly and can also be started manually. It commits `data/latest.json` and any new/changed history files only when the data changes.

The hourly schedule is deliberately independent of individual source refresh times: StrettoCharts checks the sources repeatedly and records new chart editions when they become available.

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
- Platform charts and industry charts remain identifiable as separate sources rather than being falsely presented as one official ranking.
