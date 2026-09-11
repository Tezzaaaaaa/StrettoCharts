# STRETTOCHARTS
## Product & Build Specification

### 1. Product Definition

**StrettoCharts is a search-first music chart lookup platform.** Its primary job is to let a user find an artist, song, or album and understand chart performance from trusted chart sources.

Core flow:

**Search → Select → Profile → Current chart performance → History**

StrettoCharts is not a general music analytics platform, chart-data health dashboard, music-consumption analytics product, editorial/news site, or unrelated music visualisation collection.

### 2. User Experience

The experience should be immediate, simple, focused, trustworthy, and easy to understand.

- **Search** — artist, song/track/music/record/mixtape, album/EP; matching and autocomplete.
- **Select** — choose the intended result from predictable entity sections.
- **Profile** — show the selected identity, summary, metadata, artwork, and source context.
- **Current charts** — show rank, movement, peak, weeks, and date when available; keep sources distinguishable.
- **History** — show previous chart performance through stored historical snapshots.

Search results must not become a generic ranked list. Relevance scoring determines relevance **within each entity category**.

### 3. Search & Information Architecture

Search follows this order:

```text
Search
  ↓
Match candidates
  ↓
Score candidates
  ↓
Classify by entity type
  ↓
Deduplicate
  ↓
Rank within each category
  ↓
Render predictable sections
```

Generated search results are divided into four sections:

1. **Artist**
2. **Song / Track / Music / Record / Mixtape**
3. **Album / EP**
4. **Other** — only when a result genuinely does not fit the first three.

Result cards must use one consistent design: artwork or consistent fallback, name/title, artist where applicable, entity type, useful identifying metadata, consistent dimensions, typography, spacing, alignment, responsive behaviour, and a clear focus/selected state.

**Search-result cards do not contain descriptive summaries.** A summary appears only after the user selects a result.

Selected entity view contains:

- artwork/image
- name
- entity type
- short factual summary
- relevant metadata
- current chart performance
- historical performance
- source attribution

Anything outside this structure must have a clear product reason.

### 4. Entity Identification

Search entities are derived from the existing chart data architecture and can be found in both the current snapshot and stored historical snapshots.

Supported primary entities:

- Artist
- Song
- Album

Identity matching must use normalized artist/title/album values and preserve enough context to distinguish same-named entities. Do not fabricate identity relationships.

### 5. Artwork

Artwork follows a trusted-source hierarchy:

```text
Existing trusted chart-source artwork
        ↓
Apple catalogue artwork fallback
        ↓
MusicBrainz / Cover Art Archive where appropriate
        ↓
Consistent placeholder only when no reliable artwork exists
```

Artwork must correspond to the matched entity. Do not use arbitrary image scraping, unrelated search results, or visually similar artwork.

### 6. Data Architecture

Chart data should use a consistent internal structure containing, where supplied:

- source
- chart
- market
- date
- artist
- title
- album
- rank
- previous rank
- movement
- peak
- weeks

Rules:

- Keep chart sources separate.
- Do not fabricate missing values.
- Do not create an unexplained combined ranking.
- Preserve the meaning of each source.
- Keep current snapshots separate from dated historical snapshots.
- Treat historical snapshots as stable records.
- A source failure must not corrupt successful source data.
- The frontend consumes normalized data rather than implementing source-specific parsing.

### 7. Data Sources

Each external chart source should have one authoritative ingestion path:

```text
Fetch → Parse → Normalize → Validate → Status → Store
```

A new source extends the existing data architecture rather than creating a second data system.

### 8. Frontend Architecture

```text
index.html
    ↓
dashboard.html
    ↓
search-enhancements.js
    ↓
data/latest.json + data/history/*
    ↑
scripts/update.mjs
```

Responsibilities:

- **HTML** — structure and semantic containers.
- **CSS** — presentation, layout, responsive behaviour, and visual states.
- **JavaScript** — search, matching, classification, ranking, rendering, artwork fallback, interaction, and client-side state.
- **Updater** — collection, parsing, normalization, validation, and snapshots.
- **JSON** — current and historical chart data.

Do not create files merely because a change could be placed in a new file. Extend the existing architecture when it can properly support the requirement.

### 9. Design System

Use one coherent visual language across the product: typography, spacing, hierarchy, borders, cards and rows, buttons, chart presentation, loading/empty/error states, and responsive layouts.

Reuse existing patterns. Avoid one-off visual systems, decorative features, alternate navigation structures, or competing component patterns unless there is a demonstrated product or architectural need.

### 10. States & Reliability

Important operations must have understandable states:

- **Loading** — explain that content is loading.
- **Empty** — explain when there are no matches or no chart data.
- **Error** — explain what failed and provide recovery where practical.
- **Partial data** — show available information without pretending the record is complete.
- **Source failure** — preserve successful sources and make failed-source state understandable.
- **Artwork unavailable** — use the trusted fallback hierarchy and only then a consistent placeholder.

### 11. Development Principles

1. Inspect before changing.
2. Reuse before creating.
3. Extend before duplicating.
4. Prefer existing/native capabilities and dependencies.
5. Make the smallest complete change.
6. Remove obsolete code when an implementation is replaced.
7. Avoid unnecessary abstractions, tools, dependencies, and layers.
8. Preserve validation, accessibility, responsiveness, security, reliability, error handling, and data integrity.

### 12. Feature Development

Before implementing a feature, determine:

1. Why is it needed?
2. Where does it belong?
3. Does the capability already exist?
4. What existing implementation should it extend?
5. What product, data, workflow, and UI areas does it affect?
6. What proves it is finished?

Do not solve repeated requirements by attaching another script, stylesheet, workflow, navigation layer, data file, or special-case patch when the underlying architecture should instead be extended.

### 13. Product Evolution

Every future feature must strengthen StrettoCharts as a search-first chart lookup platform.

Features should normally extend search, selection, profile, current performance, or history. Avoid drift into music analytics, chart-health monitoring, streaming-consumption dashboards, editorial/news functionality, unrelated discovery, decorative visualisation collections, or generic dashboards.

A new chart source should use the same normalization, validation, current/history, and attribution model.

New UI should use the existing design language and interaction patterns rather than creating parallel navigation, filtering, card, profile, chart, or theme systems.

### 14. Testing & Validation

**Search:**

- Artist searches return an Artist section.
- Song/track searches return the Song section.
- Album/EP searches return the Album section.
- Other appears only when necessary.
- Relevance remains correct within each section.
- Duplicates are removed.
- Search results contain no descriptive summaries.
- Selecting a result produces the detailed profile and summary.
- Current and historical matches resolve to the same entity.
- Artwork is sourced from trusted existing data or approved fallback sources.

**Frontend:**

- result selection
- profiles
- current chart performance
- history
- loading
- empty
- error
- Day/Night display
- responsive behaviour
- keyboard/focus interaction

**Data:**

- JSON remains valid
- expected sources are present
- sources remain separated
- historical snapshots are preserved
- missing values are not fabricated

**Repository:**

- no broken references
- no orphaned implementations
- no unnecessary duplicates
- workflows remain functional
- deployment succeeds

### 15. Definition of Done

A change is done when:

- intended behaviour works
- it fits the existing architecture
- existing functionality still works
- UI is consistent and responsive
- relevant states and failures are handled
- data remains trustworthy
- validation and tests pass
- duplicate or obsolete code is removed
- documentation remains accurate
- deployment is verified when applicable

**Done means working and integrated — not merely added.**

### Guiding Rule

> Build the simplest version that properly solves the user's problem, using what already exists, and leave the repository cleaner than you found it.
