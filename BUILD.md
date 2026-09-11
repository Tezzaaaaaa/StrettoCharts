# STRETTOCHARTS
## Product & Build Specification

### 1. Product Definition

**StrettoCharts is a search-first music chart lookup platform.**

Its primary job is to let a user find an artist, song, or album and understand its chart performance from trusted chart sources.

Core flow:

**Search → Select → Profile → Current chart performance → History**

StrettoCharts is not:

- a general music analytics platform
- a chart-data health or monitoring dashboard
- a music-consumption analytics product
- an editorial or news site
- a collection of unrelated music visualisations

New functionality must support the core product rather than compete with it.

### 2. User Experience

The experience should be immediate, simple, focused, trustworthy, and easy to understand.

Primary flow:

- **Search** — artist, song, or album; matching/autocomplete; ambiguity handling.
- **Select** — choose the intended result.
- **Profile** — show the selected identity.
- **Current charts** — show rank, movement, peak, weeks, and date when available; keep the source distinguishable.
- **History** — show previous chart performance through stored historical snapshots.

The interface should make the chart result the focus rather than surrounding it with unrelated dashboards or analytics.

### 3. Information Architecture

```text
STRETTOCHARTS
Search
├── Artist
├── Song
└── Album
Result
└── Selected match
Profile
├── Identity
├── Current chart performance
├── Historical performance
└── Related album/track context
```

Anything outside this structure must have a clear product reason.

### 4. Data Architecture

Chart data should use a consistent internal structure containing, where supplied:

- source
- chart
- market
- date
- artist
- title
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
- Keep the current snapshot separate from dated historical snapshots.
- Treat historical snapshots as stable records.
- A source failure must not corrupt successful source data.
- The frontend consumes normalized data rather than implementing source-specific parsing.

### 5. Data Sources

Each external chart source should have one authoritative ingestion path:

```text
Fetch → Parse → Normalize → Validate → Status → Store
```

A new source should extend the existing data architecture rather than create a second data system.

Sources remain independently identifiable and independently recoverable where possible.

### 6. Frontend Architecture

The current frontend architecture is intentionally lightweight:

```text
index.html
    ↓
dashboard.html
    ↓
search-enhancements.js

data/latest.json
data/history/*
    ↑
scripts/update.mjs
```

Responsibilities:

- **HTML** — structure and semantic containers.
- **CSS** — presentation, layout, responsive behaviour, and visual states.
- **JavaScript** — search, matching, rendering, interaction, and client-side state.
- **Updater** — collection, parsing, normalization, validation, and snapshots.
- **JSON** — current and historical chart data.

Do not create files merely because a change could be placed in a new file. Extend the existing architecture when it can properly support the requirement.

### 7. Design System

Use one coherent visual language across the product:

- typography
- spacing
- hierarchy
- borders
- cards and rows
- buttons and controls
- chart presentation
- loading, empty, and error states
- responsive layouts
- Day/Night display

Reuse existing patterns. Avoid one-off visual systems, decorative features, alternate navigation structures, or competing component patterns unless there is a demonstrated product or architectural need.

### 8. States & Reliability

Every important user-facing operation should have an understandable state.

- **Loading** — explain that content is being loaded; do not leave unexplained blank space.
- **Empty** — explain when there are no matches or no available data.
- **Error** — explain what failed and provide recovery where practical.
- **Partial data** — show the information that is actually available rather than pretending the record is complete.
- **Source failure** — preserve successful sources and make the failed source state understandable.

Reliability is part of the feature, not an optional follow-up.

### 9. Development Principles

Apply these principles to every change:

1. **Inspect before changing.**
2. **Reuse before creating.**
3. **Extend before duplicating.**
4. **Prefer existing/native capabilities and dependencies.**
5. **Make the smallest complete change.**
6. **Remove obsolete code when an implementation is replaced.**
7. **Avoid unnecessary abstractions, tools, dependencies, and layers.**
8. **Preserve validation, accessibility, responsiveness, security, reliability, error handling, and data integrity.**

A technically possible change is not automatically a product requirement.

### 10. Feature Development

Before implementing a feature, answer:

1. Why is this needed?
2. Where does it belong in the existing product?
3. Does the capability already exist?
4. What existing implementation should it extend?
5. What parts of the product, data, workflows, and UI does it affect?
6. What proves that it is finished?

Do not add a feature simply because it is technically possible or because another product has it.

### 11. Repository Hygiene

The repository should contain only things with a current purpose.

Before and after significant changes, check for:

- duplicate implementations
- obsolete files
- dead code
- unused dependencies
- competing UI systems
- redundant workflows
- stale documentation
- abandoned experiments
- unnecessary patches
- broken references
- competing data systems

When an implementation is replaced, remove the old implementation unless it has a documented current purpose.

The repository should become simpler over time, not accumulate layers around old decisions.

### 12. Testing & Validation

Testing should be proportional to the change but must cover the affected behaviour.

**Frontend:**

- search
- result selection
- profiles
- current chart performance
- history
- loading states
- empty states
- error states
- Day/Night display
- responsive behaviour

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

### 13. Future Features & Product Evolution

This section is deliberately strict because uncontrolled feature growth is one of the main ways StrettoCharts can become confusing, duplicated, or turn into a different product.

#### Purpose

Every future feature must strengthen StrettoCharts as a **search-first music chart lookup platform**. A feature is not automatically appropriate because it is technically interesting, provides more data, or can be built.

#### Before building anything new

Determine:

1. **What user problem does this solve?**
2. **Who is the feature for?**
3. **Where does the user encounter it?**
4. **What existing StrettoCharts capability does it extend?**
5. **Does it belong to search, selection, profile, current performance, or history?**
6. **Does the required data already exist?**
7. **Can the existing data model support it?**
8. **Can the existing UI architecture support it?**
9. **Is there already something that does substantially the same job?**
10. **Would it create a second way of doing something that already works?**
11. **Would it introduce a new navigation structure?**
12. **Would it introduce a new data system?**
13. **Would it introduce a new visual or component system?**
14. **Would it require another workflow or automation?**
15. **Would it introduce a new dependency when an existing/native capability is sufficient?**

#### Integration rule

A new feature should normally **extend an existing part of StrettoCharts**, rather than create a parallel product inside it.

For example:

```text
GOOD
Existing Search
    ↓
New matching capability
```

not:

```text
Existing Search
    +
New Search System
```

Likewise:

```text
GOOD
Existing Profile
    ↓
Additional chart context
```

not:

```text
Existing Profile
    +
New Analytics Dashboard
```

#### No feature-by-feature patching

Do not solve every new requirement by attaching another script, stylesheet, workflow, navigation layer, data file, or special-case patch when the underlying architecture should instead be extended.

Repeated patches around the same area are a signal that the existing implementation needs to be simplified, consolidated, or properly extended.

The goal is not to make every request work independently. The goal is to make the product and architecture work together.

#### No product drift

Features must not gradually transform StrettoCharts into another type of product.

Particularly avoid drifting into:

- music analytics
- chart-health analytics
- data-pipeline monitoring
- streaming-consumption dashboards
- editorial/news functionality
- unrelated music discovery features
- decorative visualisation collections
- generic dashboards that do not help answer a chart lookup

Additional information is appropriate when it helps the user understand the chart result they searched for.

#### New data sources

Adding a chart source is a product-relevant extension when it improves chart lookup coverage.

It should use the existing ingestion and data architecture:

```text
Existing source architecture
        ↓
New chart source
        ↓
Same normalization
        ↓
Same validation
        ↓
Same current/history model
```

A new source should not create a second storage model, update pipeline, or unrelated chart-data subsystem without a demonstrated architectural requirement.

#### New UI

New UI should use the existing design language and interaction patterns.

Do not create a separate:

- navigation system
- card system
- filtering system
- theme system
- profile system
- chart display system

unless there is a demonstrated reason the existing implementation cannot perform the required job.

#### When a feature does not fit

If a proposed feature cannot be cleanly integrated into the existing product, do not force it in.

First determine whether:

- the feature should be rejected
- the existing architecture should be refactored
- the feature belongs somewhere else
- or the product definition itself genuinely needs to change

A product-definition change must be deliberate. It must not happen accidentally through incremental additions.

#### Feature approval test

A proposed feature should pass all of these checks:

| Question | Required |
|---|---|
| Does it solve a real user problem? | Yes |
| Does it strengthen chart lookup? | Yes |
| Does it have a clear location in the product? | Yes |
| Can it reuse existing architecture? | Preferably |
| Does it avoid duplication? | Yes |
| Does it avoid unnecessary new systems? | Yes |
| Does it preserve existing functionality? | Yes |
| Does it remain understandable to the user? | Yes |
| Can it be tested and maintained? | Yes |

#### The escalation rule

If several features keep requiring patches around the same area, **stop adding patches**.

Inspect the existing implementation and determine whether the underlying component, data model, workflow, or architecture should be corrected once.

A repeated workaround is evidence that the underlying design may need attention.

#### Definition of a future feature being complete

A future feature is complete only when it:

- solves its intended user problem
- belongs naturally within StrettoCharts
- uses the existing architecture where appropriate
- does not create a competing implementation
- preserves existing behaviour
- handles relevant states and failures
- is tested and validated
- leaves the product no more complicated than necessary

**Done means integrated, not merely added.**

### 14. Definition of Done

A change is done when:

- the intended behaviour works
- it fits the existing architecture
- existing functionality still works
- the UI is consistent
- responsive behaviour is preserved
- relevant loading, empty, and error states are handled
- data remains trustworthy
- validation and tests have passed
- duplicate or obsolete code has been removed
- documentation remains accurate
- deployment has been verified when applicable

**Done means working and integrated — not merely added.**

### Guiding Rule

> Build the simplest version that properly solves the user's problem, using what already exists, and leave the repository cleaner than you found it.
