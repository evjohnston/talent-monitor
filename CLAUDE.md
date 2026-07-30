# CLAUDE.md — context for Claude Code

This file orients a fresh Claude Code session. Read it, then the README,
then `src/lib/types.ts` (the data contract) before making changes.

## What this is

Global Talent Monitor — a pipeline view of U.S. STEM talent, from K-12
foundation through degree production, graduate/postdoctoral training,
workforce entry, retention/immigration, and research output. It's a
research instrument for a policy audience (Hoover/TFL), not a consumer
dashboard — same reference point as before (ASPI's Critical Technology
Tracker: lead with country comparison, treat data-viz as the hero, look
like an instrument).

**This is a full rebuild, 2026-07-28**, replacing an earlier version of this
app ("Global Tech Monitor") that tracked quantum computing and AI through a
4-stage innovation/scaling/adoption/investment pipeline, fed by live sources
(OpenAlex, EPO, NSF, RSS) plus manual CapIQ/Massive imports. None of that
carried forward — see "What didn't survive the rebuild" below before assuming
any of the old machinery (verticals, live fetch, ticker panels) still exists.

## The talent pipeline — 6 stages

The whole app is organized around `STAGES` in `src/lib/types.ts`, in this
order:

1. **Foundation** — K-12 outcomes (PISA), school spending, early
   persistence/attrition (BPS), study abroad, UNESCO student mobility.
2. **Degree Production** — IPEDS completions, STEM share of degrees,
   doctorates overview, international share of degrees.
3. **Graduate & Postdoctoral Training** — grad enrollment/postdocs (GSS),
   postdocs at FFRDCs, international students by level/field, international
   scholars, education-export revenue.
4. **Workforce Entry** — who works in STEM (NSCG), H-1B employers, AI-company
   founders/staffing.
5. **Retention & Immigration** — stay rates, OPT growth, H-1B volume/denials,
   PERM, J-1/BridgeUSA, green-card wait times, brain-drain accounting.
6. **Research Output & Competitiveness** — citations, Nobel/Turing laureates,
   university rankings, cross-national R&D spend, patents.

This ordering is a real lifecycle funnel, not the source report's own chapter
order (see "Where the data comes from" below) — the report's chapter 4
(K-12/attrition) logically precedes chapter 1 (degree production), so stages
are reordered from chapters accordingly. Each stage keeps its source
chapter number on every `Exhibit` (`chapter: 1-6`) for traceability even
though stage order and chapter order differ.

## Where the data comes from

`talent_charts/` (repo root) is the real R project behind "The Great Talent
Competition," a report drawing on ~25 primary sources (NCES, NCSES/NSF,
USCIS, DOL, the State Department, IIE, OECD, UNESCO, OpenAlex, Clarivate,
the Nobel Foundation/ACM, Times Higher Education, WIPO, USPTO PatentsView).
Its `data/*.csv` (134 files) are the report's own finished, per-exhibit
statistics — each row already cleaned, cited, and computed by that report's
own R pipeline (`figures.Rmd`/`tables.Rmd`), not raw government exports. 86
of those 134 are the report's **final** exhibits (`titles_and_sources.csv`,
excluding the `AF`/`AT`-prefixed 77 *archived* exhibits cut from the final
report — real data, out of scope for now, see "Known gaps" below).

**Almost every exhibit is a finished, aggregated statistical series** (e.g.
"doctorates awarded per year, 1900-2024"), not a discrete dated event —a
fundamentally different shape than the old app's `Entry` model (one paper,
one grant, one deployment; a browsable list with drill-down). That's why
this rebuild replaced the data model instead of reusing it — see "Data
model" below.

`scripts/import-talent-charts.ts` reads `talent_charts/titles_and_sources.csv`
+ every final exhibit's CSV and writes `public/data/talent.json`. Real
things it has to handle, not paper over:

- **Chart-kind inference** (`inferKind`) reads each CSV's real column shape
  (a leading "Year"/entity column, whether the remaining columns are
  4-digit years, whether values sit in a fraction/percent range) to assign
  one of 5 `ChartKind`s — see "Data model" below. Checked `restAreYears`
  BEFORE `firstIsYear` deliberately: FIG410/FIG411 (UNESCO country×year
  mobility data) name their own entity column "Year" even though its real
  values are country names — confirmed by hand, not hypothetical. Getting
  this order backwards renders a real exhibit as a nonsense multi-series
  line chart with country names on a numeric axis.
- **Multi-part exhibits.** Some exhibits' real data was exported as named
  slices rather than one file per fig_no (e.g. `FIG301a`/`FIG301b` = U.S.-
  born vs. foreign-born; `TAB202a/b/c` = Engineering/Math & CS/Physical &
  Life Sciences) — the `PARTS` map hand-encodes each real label (read off
  the report's own `figures.Rmd`/`tables.Rmd` source, e.g. `sources =
  c("Biotechnology" = "TAB505a", ...)`), and merges (shared Year axis,
  columns prefixed by label) or splits (each part its own exhibit) per
  case.
- **A real derived exhibit.** FIG303 ("Are H-1B Approvals Still Concentrated
  Among a Few Employers?") has no standalone CSV — the report computes it
  inline from FIG302's own company×year data (top-10-by-year share of
  total approvals). `buildFig303` replicates that exact computation from
  FIG302's already-imported real numbers — a real derived statistic, not a
  fabricated one, same house convention as the report's own "authors'
  analysis of" endnotes.
- **A pivot export's "Grand Total" footer row** (confirmed real — the last
  row of `FIG302.csv`/`FIG410.csv` literally reads `Grand Total,...`) gets
  dropped at read time (`isTotalRow`) — keeping it would make it outrank
  every real company/country on every leaderboard, since it's a sum of all
  of them.
- **A blank-headed column with one stray value** (confirmed real in
  `FIG513.csv`: one row's `skewness` cell lost its decimal point,
  `"3.514"` → `"3514"`, shifting that row's real `kurtosis` value one
  column right into a trailing unnamed column) gets dropped regardless of
  whether it holds a value — a blank column name is never a legitimate
  metric, and silently ranking by it (as the *last* real-numeric column)
  broke that whole exhibit before this was caught.
- **Five of six originally-skipped exhibits are ported (2026-07-29)** —
  `TAB303`, `FIG405`, `TAB503`, `TAB504`, `TAB605` all had no standalone
  CSV, computed inline in the report's own R pipeline (`figures.Rmd`/
  `tables.Rmd`) from other tables' already-real data. Each one's real R
  formula was traced by hand and replicated as its own `build*` function
  (`buildTab303`, `buildFig405`, `buildBookendTypeTable` for both
  TAB503/TAB504 — they share one real shape, just different source
  exhibits and category columns — and `buildTab605`), called from `main()`
  the same way `buildFig303` already was. `TAB605` needed its own real
  source files too: `TAB605a/b/c.csv` exist in `talent_charts/data/` but
  were never given their own `titles_and_sources.csv` row (they're
  `build_eb_combined_table`'s own R-side inputs, not independently citable
  exhibits) — read directly by id via the same `readExhibitCsv` any other
  exhibit uses, bypassing the normal `finalIds` loop.

  Porting these surfaced a real, separately-fixed bug: `FIG405`'s own
  derivation needs FIG404's `K-12 (in USD)`/`Tertiary (in USD)` columns as
  numbers, but `coerce()` only recognized plain digit strings — a
  thousands-comma-formatted value like `"2,302.00"` silently stayed a
  string, invisible to `numericColumns()`. Confirmed by hand this was the
  ONLY exhibit in the real imported data affected (checked every string
  value across every exhibit for the pattern before touching shared
  `coerce()` logic) — fixed there now, not worked around locally, so
  FIG404's own existing chart benefits too, not just the new derivation.

  `TAB603` alone is still skipped (`SKIP_COMPUTED = ["TAB603"]`) — its own
  real R source (`build_sector_bookend_table`) reads `AF60`/`AF61`,
  genuinely archived exhibits the report's own authors cut before the
  final manuscript. Porting it means first deciding whether to import
  archived source data at all — a real, separate architectural call, not
  made unilaterally alongside five formula replications.

**No live source, no cron.** None of these ~25 source families update
faster than annual/biennial, and the CSVs are already the report's finished
output — there's nothing to poll on a 3-hour cadence the way the old
OpenAlex/EPO/NSF/RSS pipeline did. `public/data/talent.json` is a normal
**committed file** (not gitignored, not split onto a separate `data`
branch — that whole mechanism existed to protect a human's `git pull` from
a bot's frequent commits, which doesn't apply once nothing fetches on a
schedule). Regenerate it by re-running `npm run import-talent-charts`
whenever `talent_charts/` gets a fresh export from the report's authors —
same manual/periodic pattern the old app used for its CapIQ imports, not a
nightly build. `.github/workflows/build-and-deploy.yml` just builds and
deploys whatever's already committed; no fetch step, no secrets, no
schedule trigger.

## Data model (`src/lib/types.ts`)

```ts
export type Stage = "foundation" | "degree-production" | "graduate-training"
  | "workforce-entry" | "retention-immigration" | "research-output";

export type ChartKind =
  | "timeseries"        // year -> one or more numeric series (most exhibits)
  | "share-timeseries"  // year -> percentage/share series
  | "leaderboard-years" // entity (+ country) -> value per year
  | "ranked-bar"        // entity/category -> single value, one snapshot
  | "country-map";      // country -> value

export interface Exhibit {
  id: string;       // fig_no, e.g. "FIG101" — stable key
  stage: Stage;
  chapter: number;   // 1-6, the source report's own chapter
  order: number;      // display order within its stage
  title: string;       // real exhibit title, from titles_and_sources.csv
  kind: ChartKind;
  sourceShort: string;
  sourceLong: string;
  sourceUrls: string[];
  columns: string[];    // raw CSV header, preserved as-is
  rows: Record<string, string | number | null>[]; // raw CSV rows, numeric-coerced per cell
}
```

`DataFile` is just `{ generatedAt, exhibits: Exhibit[], notes: StageNote[] }`
— one file, one subject, no multi-vertical switching (see "What didn't
survive the rebuild"). `StageNote` is unchanged from the old app: one
analyst "so what" note per stage, in `data/talent/notes.ts`.

There is no `Provenance` tier anymore (`live`/`seeded`/`auto`) — that
distinction existed to separate institution-attributed live data from
keyword-classified RSS pickups, and nothing here is live-fetched or
auto-classified. Every exhibit is equally a finished, cited statistic; its
real citation (`sourceShort`/`sourceLong`/`sourceUrls`) is the honesty
layer instead, surfaced on every panel via `ExpandableMethods`.

### Rendering: `ExhibitChart` dispatches on `kind`

`src/components/ExhibitChart.tsx` reads an `Exhibit`'s `kind` and picks the
matching chart, using extraction helpers in `src/lib/exhibitData.ts`
(`toSeriesChart`, `toCountryMapValues`, `toLeaderboardYears`,
`toRankedBars` — each reads `columns`/`rows` generically, no per-exhibit
hardcoding):

- `timeseries`/`share-timeseries` → `SeriesChart.tsx`, a generic line chart
  (year → N named series). Share exhibits get a real range check at render
  time (`isFraction` in `ExhibitChart.tsx`) — some store a raw 0-1 fraction
  (needs ×100 to read as a percent), others (e.g. FIG207, whose columns are
  literally named "Percent of ... post-docs") already store a 0-100 point.
  Detected from the actual data, never assumed from `kind` alone.

  **Chart library**: `SeriesChart.tsx` is built on `@nivo/line`
  (`ResponsiveLine`, Phase 4's chosen "heavier" library over Recharts/visx
  — Nivo alone covers all 5 `ChartKind`s including a real choropleth and
  Sankey component, not just line/bar). `ResponsiveLine`, not the
  fixed-size `Line` — confirmed by hand that `Line` renders a real `<svg
  width height>` but never a `viewBox`, so a CSS `width:100%` override
  crops the fixed-pixel drawing instead of scaling it (a real bug: every
  3-column exhibit panel overflowed into its neighbors before this was
  caught). `ResponsiveLine` measures its real container via
  `ResizeObserver`, which sounds SSR-hostile, but its `defaultWidth`/
  `defaultHeight` props (a documented `react-virtualized-auto-sizer`
  passthrough) give it a real, deterministic size during Astro's
  build-time SSR pass, then it self-corrects to the true measured size
  the instant JS hydrates — confirmed both ends: the static HTML renders
  a real, correctly-sized (not overflowing) chart, and a hovered country
  on `WorldMap.tsx` correctly fades every other line in a same-page
  `SeriesChart` to `--line-2` (a flat neutral swap, not a lowered opacity
  — Nivo's `colors` prop returns one solid color per series with no
  per-series opacity knob on the base line layer, so "de-emphasized" is
  expressed as "not colored" here instead). The other 4 `ChartKind`s
  (`WorldMap`/`LeaderboardYears`/`BarRow`/Sankey) are still the original
  hand-rolled SVG — migrating each to Nivo's matching component
  (`@nivo/geo`, `@nivo/bar`, `@nivo/sankey`) is real follow-up work, not
  done in the same pass as this first one.

  **The redesign brief's own >6-series rule**: 25 real exhibits across
  every stage have more than 6 numeric columns (TAB202's 3 parts each
  have 31 real country columns; FIG206 has 17; FIG411 has 20) — a plain
  line chart at that count is an illegible tangle, confirmed by hand on
  FIG206 before this existed. Past `MAX_SERIES_WITHOUT_PICKER` (6),
  `SeriesChart.tsx` defaults to the 6 series with the biggest most-recent
  real value (not column order) and turns its legend into real toggle
  buttons (`aria-pressed`, keyboard-reachable) plus a "show all N" link —
  click any series to add or remove it. The default selection is computed
  from `series` alone (no `Math.random`/`Date.now`), so it's identical on
  the server and the first client render: a no-JS reader sees the same
  real, sensible 6-series default a JS reader starts on, not a blank or
  unfiltered chart. Exhibits at 6 series or fewer (the large majority)
  render byte-for-byte the same static `<span>` legend as before this
  existed — the picker UI doesn't appear at all below the threshold.

  A real bug caught building this: a hidden series' swatch was originally
  recolored to `--line-2` (a neutral gray) to signal "off" — but most
  non-tracked countries already render in that same muted
  `--country-other` gray (see `countries.ts`), so "hidden" and "visible,
  but a minor country" became visually indistinguishable the moment a
  real 17-country exhibit was checked by eye. Fixed by leaving the
  swatch's real color untouched always and carrying hidden state on the
  label itself (opacity + strikethrough) instead.
- `country-map` → `WorldMap.tsx`. Real distinction, checked by hand: a
  **count** (works/founders by country — real-zero-floored, often
  Pareto-skewed) sqrt-compresses off a true 0 floor; a **range** (a PISA
  score, a percentage-point gap that can go negative) has no meaningful
  zero floor and scales linearly across the data's own real min-max
  instead. Getting this wrong reads as "every country basically the same
  shade" (confirmed: that's exactly what FIG402's PISA map looked like
  before this distinction existed) — `ExhibitChart.tsx` picks the mode from
  the exhibit's real value range, not from `kind`.
- `leaderboard-years` → `LeaderboardYears.tsx` (entity × year grid — H-1B
  employers, patent leaders — rendered one selected year at a time via a
  year-chip picker, not a wide table needing horizontal scroll).
- `ranked-bar`, and the catch-all for any shape that doesn't cleanly fit
  the other four → a plain `BarRow` list, ranked by the most recent
  real-numeric column. Every leading non-numeric column joins into one
  label (e.g. FIG512's Country+Company, TAB604's Country+Year+Status) —
  the first column alone repeats across rows for these shapes and would
  otherwise collide; adjacent identical values (a display name + its own
  normalized key, e.g. TAB501's "conference" + "conf_norm") get deduped so
  a label doesn't read "colt · colt". A real negative value (TAB101's
  "percent change in share" columns — a field genuinely losing
  international share) clamps its bar to 0 width rather than the raw
  `(value/max)*100`: an unclamped negative percent sets an invalid `width:
  -N%`, and `BarRow`'s `.fill` has no CSS width fallback, so the browser
  drops the whole declaration and the bar defaults to the FULL width of
  its track — a negative value rendered as the single longest bar on the
  page, caught by hand on TAB101. The real signed number still shows in
  the row's own label text; only the bar itself is clamped.

`ExhibitPanel.tsx` is the one building block every Track page uses: real
title, real chart, real citation footer — never optional, since every
number here traces to a specific cited source.

## Dashboards: Overview + 6 Tracks

`src/dashboards/` keeps the old app's "Track" pattern (one file per stage,
`DashboardContext`, `DashboardNavigation` tabs) — just repointed at the new
stage set. `TrackShell.tsx` is the shared shape all 6 `Track*.tsx` files use:
the stage's latest analyst note as a takeaway, one full-width "hero" exhibit
(the one the note is grounded in), then every other real exhibit for that
stage as its own panel. **Every exhibit for a stage renders somewhere** —
no top-N cut of the real data; a stage with 20 exhibits gets 20 panels, not
a curated 6.

**Two ways the "every other exhibit" part renders**, both in `TrackShell.tsx`:
- Default (no `sections` prop passed) — one flat grid, three panels a row.
  Still every stage's actual behavior except Retention & Immigration (below).
- `sections` — named editorial groups (`TrackSection[]`, each a real title +
  the exhibit ids that answer it together), the publication-redesign
  brief's own "editorial, non-grid sequence" ask, first built for
  `TrackRetentionImmigration.tsx`: hero (the retention-gap Sankey) →
  "What happens right after the PhD: the work-authorization pipeline"
  (FIG603/604/605) → "Employer-side friction: the PERM backlog"
  (FIG606/TAB604) → "Who's declining to stay, and where they go instead"
  (FIG607/TAB601/TAB602) → "Why it matters" (FIG608/609) — grounded in
  `docs/report-crosswalk-notes.md`'s own read of this stage's real
  groupings, not an arbitrary chunking of 10 exhibits into rows of 3. Any
  real exhibit NOT named in a section still renders, in a flat-grid
  fallback after the named sections — a future data refresh adding an
  exhibit this hand-authored list doesn't know about yet degrades to
  "shows up, ungrouped," never "silently disappears."
- `excludeIds` — exhibits that feed `heroContent`'s own numbers directly
  (FIG601/602 feed `retentionFunnelSankey`) and would otherwise render
  AGAIN as their own standalone panel, repeating what the hero already
  shows. Real, confirmed duplication bug before this existed — `TrackShell`
  only ever excluded `heroId`-based heroes, and `heroContent` (a custom
  ReactNode, not an exhibit id) had no exclusion mechanism at all.

All 6 stages now use `sections`: Retention & Immigration, Degree
Production, Foundation, Graduate & Postdoctoral Training, Workforce
Entry, Research Output & Competitiveness (2026-07-28). The flat-grid
default path in `TrackShell.tsx` is unused by any current Track page but
deliberately kept, not deleted — it's what a genuinely new stage (or an
exhibit set too small/uniform to warrant named grouping) should reach for
first, per "How to extend"'s own instinct against forcing structure onto
data that doesn't call for it.

**Three real hero/crosswalk discrepancies surfaced doing this, resolved
2026-07-29** — same shape each time: Graduate & Postdoctoral Training
(crosswalk said FIG201, shipped hero was FIG207), Workforce Entry
(crosswalk said FIG302 with FIG303 merged in, shipped hero was standalone
FIG303), and Research Output & Competitiveness (crosswalk said FIG501 as
one metric-switcher explorer absorbing 7 other exhibits, shipped hero was
standalone TAB506). Resolved by updating `content/report-crosswalk.csv`'s
`proposed_web_role` to match what's actually shipped (FIG207/FIG303/
TAB506 are now that CSV's own `stage_hero` rows too), not by rewriting
analyst notes or swapping exhibits to match the original plan — every one
of those three stages' `data/talent/notes.ts` headlines is written about
the SHIPPED hero's own finding, and picking a different finding to lead
with is a real editorial-content decision, not an engineering fix, so it
wasn't made unilaterally. The original richer plans aren't lost — each
CSV row now says explicitly what the deferred future version would be
(a FIG201+FIG202 count/share toggle; the full H-1B explorer with FIG303
merged in; the Research Output metric-switcher, the largest of the three
since it's a real interactive component that doesn't exist yet, not just
a different exhibit id) — worth a real look if any of these three stages'
headline finding ever gets revisited.

**Click-to-pin, a real `WorldMap.tsx` `onSelect` caller, finally — and
country-compare mode.** The Phase 0 UX audit caught this by hand:
`onSelect` (the prop that makes a map country keyboard/click-operable)
existed in `WorldMap.tsx` — real `tabIndex`/`role="button"`/`onKeyDown`
handling, fully built — but no caller anywhere in the app ever passed it,
so no map was clickable or keyboard-reachable at all. `TrackShell.tsx`
now owns a `pinnedCountries` list alongside its existing hover-based
`emphasizeCountry`: clicking (or pressing Enter/Space on) a country pins
the cross-highlight so it survives after the mouse leaves the map, with a
real "Pinned/Comparing: `<countries>` — Clear" bar (one removable chip per
pinned country) shown above the page's panels. A hover always takes
priority over pins while it's actively happening (`effectiveCountries =
emphasizeCountry ? [emphasizeCountry] : pinnedCountries`) — a quick peek
at a different country doesn't require unpinning first.

This became real country-*compare* mode almost for free: clicking a
second country ADDS to the pinned set rather than replacing it, since
`emphasize`/`isFaded` in `SeriesChart.tsx` and `WorldMap.tsx` already did
a real array-membership check (`.includes`), not an equality check
against one value — no changes needed in either chart component, only to
how `TrackShell` manages the pinned set (`handleSelect` toggles
membership; a second click on an already-pinned country removes just
that one). The bar's own label switches from "Pinned" to "Comparing" once
more than one country is pinned, and gains a "Clear all" alongside each
chip's individual remove button.

**The pinned set round-trips through the URL** (`?countries=US,CN`,
`src/lib/urlState.ts`'s `readPinnedCountriesFromUrl`/
`writePinnedCountriesToUrl`) — a pinned/compared view is a real,
shareable/bookmarkable link, not state that vanishes on reload.
`replaceState`, not `pushState` (clicking through several countries
shouldn't spam back-button history, same reasoning the old
`writeDashboard` used before routes replaced it). The original single-
country `?country=XX` param (from before compare mode existed) is still
READ for backward compatibility with any already-shared link, merged into
the new list, but never WRITTEN again. SSR-safe by construction, not by
luck: `pinnedCountries` starts `[]` on BOTH the server render and the
client's first render (no lazy `window`-reading initializer), so
hydration always matches; the real `?countries=` value is only read in a
mount effect, the same pattern `ThemeToggle.tsx` already uses for its own
initial value. A no-JS reader loading a shared `?countries=US,CN` link
sees the real page content but no pins (reading the URL needs the
client-side effect) — an honest, expected degradation, not a bug. Any
entry that isn't a real 2-letter shape is dropped silently rather than
pinned and printed verbatim.

`Overview.tsx`'s KPI row is six real numbers, one per stage, each read off
that stage's own hero exhibit via `toLatestValue`/`toRankedBars` — never a
fabricated summary/index number.

## Astro migration (2026-07-28, static-first rendering)

The app was a pure client-rendered Vite + React SPA through the talent
rebuild above — real HTML was one empty `<div id="root">`, and every
title, finding, chart, and citation existed only after JS ran. A later
publication-redesign pass (see `content/report-crosswalk.csv` and
`docs/current-*-audit.md` for the fuller audit this came out of) requires
real per-stage URLs and a working no-JS floor (titles, findings, source
notes, and chart output must all survive JS being off), so the app moved
from Vite's plain React plugin to **Astro**, in static-output mode, with
`@astrojs/react` for islands. Astro was chosen over a hand-rolled
prerender step specifically because it turns both requirements into one
change: each stage becomes a real file-route under `src/pages/`, and
Astro's default behavior for any framework component — server-render its
real static markup at build time, THEN hydrate — gives real content
without JS for free, with no separate prerendering pipeline to maintain.

- **Routing.** `src/pages/index.astro` (Overview) plus one `.astro` file
  per stage (`foundation.astro`, `degree-production.astro`, etc.) replace
  the old single `App.tsx`'s internal `dashboard` state + `?dashboard=`
  query param (`src/lib/urlState.ts` is now just the `Dashboard` type, not
  read/write helpers). `src/layouts/BaseLayout.astro` is the shared shell
  (masthead, `DashboardNav.astro`'s real `<a href>` list, footer) every
  page wraps its content in.
- **Data loading moved from client fetch to build time.** The old
  `App.tsx` fetched `public/data/talent.json` in a `useEffect` and
  silently swallowed a failed fetch (`.catch(() => {})` — a real,
  audited bug: no user-facing error state existed). Every `.astro` page
  now reads that same committed file directly off disk at build time via
  `src/lib/loadTalentData.ts` (Node `fs`, resolved from `process.cwd()`
  — NOT `import.meta.url`, since Astro relocates a module into
  `dist/.prerender/chunks/` during build and an `import.meta.url`-relative
  path would resolve against that relocated location instead of the real
  project root) and `src/lib/buildContext.ts` (the same
  `exhibitsByStage`/`latestNote` grouping `App.tsx` used to compute
  client-side, moved to one shared function). There is no runtime fetch
  of `talent.json` left to fail.
- **`DashboardContext`** (`src/dashboards/types.ts`) dropped `dashboard`,
  `navigate`, and `dark` — a framework-component prop passed from an
  `.astro` page must serialize to JSON for hydration, and cross-page
  navigation is now a real link, not client state. The one caller that
  used `ctx.navigate` (Overview's "Open `<stage>` →" pill) is now a plain
  `<a href>`.
- **Islands are `client:load`, not `client:only`** — every `Overview`/
  `Track*.tsx` component still renders its full real output (KPI numbers,
  exhibit panels, chart SVGs, Sankey ribbons) at build time; the client
  bundle only adds interactivity (hover tooltips, cross-highlight,
  methodology disclosure) on top of markup that was already there. Two
  real bugs surfaced and got fixed specifically because they'd never been
  checked without JS before:
  - `ChartFrame.tsx`'s `ExpandableMethods` used to gate its whole body
    behind `useState(false)` — with JS off, the conditionally-rendered
    body was never in the DOM at all, not just visually hidden. It's now
    a native `<details>/<summary>`, so the real methodology text ships in
    the static HTML and expands with zero script; the old ▲/▼ toggle text
    is now pure CSS (`.expandable-methods[open] .expandable-methods-caret`).
  - `useCountUp.ts` used to initialize its displayed value at `0` and
    animate up to the real target only inside a mount effect — meaning
    every KPI on the Overview page rendered as a literal "0" before JS
    ran. It now initializes at the real target and the mount effect
    resets to 0 and animates back up as a JS-only reveal layered on top,
    so the number is always real, JS or not.
- **A real SSR/hydration bug, found and fixed by hand** — `Sankey.tsx`'s
  particle dots (`sankeyParticles.ts`) compute their lane geometry via
  `Math.sin`-based hashing, which returned values differing from Node
  (the build's SSR pass) to the browser (the client hydration pass) by a
  couple of floating-point ULPs despite identical inputs — enough for
  React to log a real hydration-mismatch warning on every page with a
  Sankey, confirmed by hand (server/client `path`/`r` strings differed
  only from the 12th significant digit onward). Fixed by rounding every
  coordinate to 2 decimals before it goes into the SVG attribute string —
  an SVG doesn't need float64 precision, and rounding removes the
  cross-engine noise entirely.
- **News ticker and theme toggle stay client-only** (`NewsTickerLoader.tsx`,
  `ThemeToggle.tsx`, both `client:load`) — deliberately, not an oversight:
  the ticker is genuinely live-fetched per page load (see its own section
  below) and the toggle is a real click interaction, so neither has a
  meaningful no-JS version. The toggle's *default* theme (light, unless
  `localStorage`/`prefers-color-scheme` says dark) still renders correctly
  without JS; a blocking inline `<script>` in `BaseLayout.astro`'s `<head>`
  sets the real value before first paint so a returning dark-mode reader
  never sees a light flash, the same problem a client-only `useEffect`
  would have caused either way.
- **Astro-only client env vars need the `PUBLIC_` prefix**, not Vite's old
  `VITE_` — `NewsTickerLoader.tsx` reads `PUBLIC_WORKER_URL` now, not
  `VITE_WORKER_URL`.
- **Commands are unchanged at the `npm run` layer** (`dev`/`build`/
  `preview`/`typecheck`), but now shell out to `astro`, not `vite`,
  underneath — `vite.config.ts`/`index.html`/`src/main.tsx`/`src/App.tsx`
  are gone, replaced by `astro.config.mjs` and `src/pages/`.
  `npm run typecheck` (`tsc -b --noEmit`) still only checks `.ts`/`.tsx`;
  `.astro` frontmatter is checked by `astro build` itself, not by `tsc`.
- **Known follow-up, not yet done** — the Cloudflare Worker's
  `ALLOWED_ORIGINS` (`worker/wrangler.jsonc`) has been updated in source
  to add `astro dev`'s default port (`localhost:4321`, replacing Vite's
  old `:5173` as the primary local origin) but **not yet redeployed** —
  until someone runs `wrangler deploy` from `worker/`, the live news
  ticker will log CORS errors against a local `astro dev` server (it still
  fails soft to an empty ticker, so this isn't a broken feature, just a
  noisy local console). Deploying is a real change to a shared live
  service, so it wasn't done without asking first, consistent with this
  file's own instinct to flag anything that touches shared/production
  state rather than doing it silently.
- **Known follow-up, not yet done** — every page still ships the full
  `exhibits` corpus to its React island's hydration payload, not just
  that stage's own slice — unchanged from the old SPA's behavior, and a
  legitimate future performance pass, not something this migration tried
  to also fix in the same change.

## Build chunking (2026-07-29)

`astro.config.mjs` adds a `manualChunks` split after Vite's default
chunking put every Track page's real chart dependencies (`@nivo/line` +
`@react-spring/web`, `react-simple-maps` + `d3-geo` + `topojson-client` +
world-atlas's country geometry) into one 500kB+ chunk alongside
`TrackShell.tsx`'s own small component code — confirmed by hand
(`du -h dist/_astro/*.js`) before picking a fix, not guessed from Vite's
generic warning text alone. Split into `vendor-nivo`/`vendor-map`/
`vendor-sankey`, leaving `TrackShell`'s own chunk at 24kB. Doesn't reduce
total bytes a chart-heavy page downloads — these are real, needed
libraries — but lets the browser fetch them in parallel instead of one
serial blob, and lets them stay cached across deploys that only touch
this app's own component code.

A real regression caught on the first attempt, not shipped: matching a
bare `"world-atlas"` substring also swallowed `countries-50m.json` —
WorldMap.tsx's genuinely lazy `import()`, loaded only when a reader
clicks "expand map" — into the eager `vendor-map` chunk, defeating that
lazy-load entirely (confirmed: `countries-50m.*.js` stopped existing as
its own chunk). Fixed by matching the specific eagerly-imported
`world-atlas/countries-110m` path instead of the whole package. Verified
the fix, not just the shrink: a Playwright check confirmed
`countries-50m` is fetched zero times before clicking "expand map" and
exactly once after.

`chunkSizeWarningLimit: 800` covers the one legitimately-still-large
chunk left after the split: `countries-50m.json` itself (740kB, that same
lazy hi-res geometry). It's a real, deliberate exception, not a threshold
raised to hide a genuine problem — this chunk is never part of any page's
initial JS, so it isn't the kind of chunk the default warning exists to
catch (one that blocks first render).

## What didn't survive the rebuild

Deleted outright, not adapted, because none of it maps onto exhibit-shaped
statistical data (see "Data model" above for why): the `VERTICALS` registry
and multi-vertical tab-switching (`src/lib/verticals.ts`); every live
source (`src/lib/sources/{openalex,epo,nsf,rss,secEdgar,massive,
usaSpending,samGov}.ts`) and `scripts/fetch-data.ts`; the `worker/`
Cloudflare Worker (removed from the repo — this does **not** undeploy the
live Cloudflare Worker itself, that's a separate manual `wrangler delete`
if it's ever wanted); the CapIQ/PitchBook R&D and VC-funding imports and
their committed data (`data/capiq/`, `data/pitchbook/`,
`scripts/import-capiq-*.ts`, `scripts/import-pitchbook.ts`,
`scripts/ciq_pipeline/`); the public-markets/ticker panel
(`CompanyMarketPanel`, `RdSpendTrend`); the findings engine, change log,
comparison ribbon, org financial index, money-flow Sankeys, collaboration
network, record explorer, and news ticker (`src/lib/{aggregate,
orgFinancials,resolveOrg,entityResolution,companyCategory,
institutionCountry,sourceMeta,relevanceScore,moneyFlow,vcInvestors,
researchFlow,collaboration,claims,compareSentence,countryProfile,
dashboardSummaryCards,ecosystemMatrix,stackComparison,bumpChart,
drawerTarget,thresholds,findingsEngine,findings,changeLog}.ts` and their
component counterparts) — all built around `Entry[]` having rich per-record
signal (citations, `amountUsd`, org, collaborating countries) that exhibit
data doesn't have and shouldn't be faked to have.

The old app's quantum/AI code and data are still fully recoverable from git
history (every commit before 2026-07-28) if a future session ever needs to
reference how something worked — this wasn't force-pushed away, just
removed going forward.

**Kept and repointed**, not rewritten from scratch: `KpiCard`, `BarRow`,
`Tooltip`, `PanelTabs`, `ChartFrame.tsx` (`SectionHeader`/`EmptyState`/
`ExpandableMethods`/`PolicyTakeaway`), `MethodNote`, `NoteCard`, `Card`,
`countries.ts`, `continentMap.ts`, `format.ts`, `chartLabels.ts`,
`useReducedMotion.ts`, the dashboard nav (6 stage tabs + Overview, driven
by `STAGES` instead of a hardcoded 4-item array — now `DashboardNav.astro`,
a real `<a href>` list rather than a React tab strip, see "Astro
migration" below).

`csvExport.ts` is NOT on this list, despite this section (and the "Known
gaps" section below) both having claimed for several sessions that it
was — a real, confirmed documentation error, not a correction of
anything that actually changed. This same rebuild commit's own diff
shows `csvExport.ts` deleted, yet its own rewritten CLAUDE.md immediately
claimed the file survived; nothing since caught the mismatch, since
nothing needed the export UI until it did (see "Known gaps"). Rebuilt
2026-07-28 (same implementation the old file had, read from git history)
once this was noticed, and wired into `ExhibitPanel.tsx`.
`Leaderboard.tsx` and `WorldMap.tsx` were kept but edited to drop their
`Entry`/`TrendPoint`/`aggregate.ts` dependencies down to plain generic
props (`{ name, country?, value }[]` and `{ values: Record<string,
number> }` respectively) — see git history on those two files for the
before/after if a future change needs the old shape back.

## Country attribution and color

Every real country in an exhibit gets colored the same way the old app's
final scheme did (`countries.ts`'s `countryColor()`, unchanged): named-actor
identity for US/China/India/the EU bloc, one restrained neutral
(`--country-other`) for everyone else — not a full per-country palette, and
not the continent-based six-tone scheme an earlier version of the old app
tried and reverted from. `SeriesChart.tsx` resolves a series' real country
(by name OR code — exhibit CSVs store country series under display names
like "South Korea", not ISO codes) via `codeFromCountryName()` before
applying `countryColor()`, so a real country series gets its real color
regardless of which form the CSV happens to use.

For a named series that ISN'T a country (degree levels, test subjects, visa
categories), `SeriesChart.tsx` cycles the `--cont-*` continent-color tokens
in `index.css` — these went unused once country color reverted to the
named-actor scheme, so this reuses an existing small, restrained token set
rather than inventing a new decorative palette. Same "don't add a color
that doesn't mean anything" rule as always; this is the one deliberate
exception, and it's a repurpose, not a new palette.

## Design system

Unchanged from the old app — still v3, "tightened instrument": zero radius
(`--r: 0px`) everywhere, borders not shadows (`.panel`), Inter/no serif,
color spent on exactly two things (Hoover Red as the one brand accent, real
country data), one component reused per job, 8pt spacing grid. Tokens live
at the top of `src/styles/index.css`; don't drift back toward shadows,
gradients, or a second radius value. See git history / the design-system
section of any pre-2026-07-28 commit for the full original rationale if
needed — the rules didn't change, only the subject being rendered did.

### Hoover brand sources (two documents, two different jobs)

**"Hoover Style Guide April 2026.pdf"** (repo root, gitignored — see
`.gitignore`'s note on reference materials) is copyediting-only. Every
page of it is Chicago Manual of Style-based prose guidance —
capitalization, punctuation, number formatting, terminology (its own
table of contents: Editorial Process, Author Submissions, Style
Essentials, Usage Guide). It specifies zero color, typeface, logo, or
layout guidance. Genuinely useful for the later editorial pass (Phase
10/11 of the redesign brief — e.g., "58,131" vs. spelling out numbers
under one hundred, "US" vs. "U.S.", em/en dash usage), but not a source
for visual-identity questions — a real finding worth knowing before
searching it for color/type answers again.

**"HooverBrandingGuide2023.pdf"** (repo root, gitignored, supplied after
the above was discovered) is the real visual brand guide, and it draws a
distinction worth preserving carefully: it has TWO separate official
palettes for two different jobs.

- **Print/logo palette** (Pantone 404/877/8401 — the primary Hoover
  tower-symbol logo itself is reproduced in these): named in `index.css`
  as `--hoover-warm: #887E6F` (404), `--hoover-gray-light: #A7A9AC`
  (877), `--hoover-gray: #777575` (8401). **8401 is reserved "to be used
  by the Hoover Legacy Society"** per the guide's own text — not a
  general-purpose neutral, don't reach for it as one.
- **Website palette** (the guide's own Appendix C, "Website Colors and
  Fonts" — a genuinely different, blue-gray secondary family, not the
  print palette's warm taupe/silver): Primary `#98002E` / `#887E6F` /
  `#000000` / `#FFFFFF`; Secondary `#ADBEC7` `#718D9B` `#43555F`
  `#4E0806` `#F8F8F8` `#E8E8E8` `#B9B9B9` `#707070` — named in
  `index.css` as `--web-secondary-*`. This app's `--slate`/`--mist`/
  `--panel`/`--panel-2` were independently tuned to almost exactly this
  real family already (confirmed by hand: the old invented `--mist
  #7c8794` differed from the guide's real `#718D9B` by only a few RGB
  points) — those four, plus `--line-2`, are now snapped to the literal
  brand-guide hex instead of the close-but-invented value that predated
  this check. `--ink`/`--ink-2`/`--line` are deliberately left as
  previously tuned — no exact brand-guide match exists for those roles,
  and inventing an interpolated "brand-adjacent" shade would be less
  honest than tuning for contrast directly, same reasoning as the
  country/continent color rules above.

**Fonts**: the brand guide specifies **Synthese** (Bold/Regular/Light/Book
Oblique) as the official website font family — separate from Adobe
Garamond Pro/Gotham, which are the PRINT typefaces. This app still uses
Inter (`--sans` in `index.css`), not Synthese — no Synthese font files or
license have been supplied yet, and Inter was kept as a placeholder rather
than guessed at with a lookalike. Swapping this in is real follow-up work
once font files/a license are available.

**Logo**: the masthead now shows Hoover's own primary mark (solo, not a
Hoover+TFL cobrand — decided by hand rather than guessed, since the
brand guide's own cobranding pattern of entities separated by a vertical
hairline would have been just as easy to build if that had been the
call). No separate SVG/vector logo asset file was supplied, so
`src/assets/logos/hoover-logo-{light,dark}-bg.png` were produced by
extracting the brand guide's own Primary Logos page: `pdftocairo`/
`pdftoppm` (installed via `brew install poppler`) rendered that page at
600 DPI, a small Python/Pillow script isolated the horizontal lockup by
its real fill color (warm-gray #887E6F, distinguished from the page's
black body text and cyan measurement guides by requiring a warm R>B
cast, not just color distance — plain distance alone was catching
anti-aliased gray text pixels that happen to sit close to 887E6F on the
gray axis) and re-rendered it as flat black-on-transparent and
white-on-transparent PNGs — both explicitly sanctioned reproduction
colors per the guide's own Logo Colors page, not colors invented for
this purpose. `.wordmark-logo`'s height went from the old wordmark's
24px to 32px in `index.css` — the tower icon's linework needs more room
than the old single-line Tech Futures Lab wordmark did to read as a
tower rather than a smudge. A real vector source file, if one becomes
available later, would still be the better long-term asset — this
raster extraction is a solid, real, on-brand stand-in, not a placeholder
guess.

## Known gaps

- **One exhibit still not ported**: `TAB603` — computed inline in the
  report's own R pipeline (`build_sector_bookend_table`) from `AF60`/
  `AF61`, genuinely archived exhibits (see below), not from a standalone
  CSV. The other five originally in this bucket (`TAB303`, `FIG405`,
  `TAB503`, `TAB504`, `TAB605`) are ported — see the "Ingestion" section's
  own note on each one's real derivation. Porting `TAB603` means first
  deciding whether to import archived source data at all.
- **The 77 archived (`AF`/`AT`-prefixed) exhibits** are real data, cut from
  the report's final version — not imported, not rendered anywhere. Worth
  revisiting if a future "extended data" section is wanted; the importer
  already skips them cleanly (`finalIds` filter) rather than needing new
  code to add them later.
- **The generic `ranked-bar` fallback** is a deliberate, disclosed
  trade-off for exhibits that don't cleanly fit the other four `ChartKind`s
  (e.g. FIG404's country+group+5-metric snapshot) — it picks a reasonable
  default (last real-numeric column, composite label) rather than a
  bespoke chart per exhibit. Fine for now; a future pass could add more
  `ChartKind`s if a shape recurs often enough to be worth a dedicated
  renderer. Two real shapes already got exactly that dedicated treatment,
  both 2026-07-29:
  - **TAB501** (`src/lib/aiConferenceCatchUp.ts`, dispatched by exhibit id
    in `ExhibitChart.tsx`, same house convention as FIG303's
    `buildFig303`) — its real shape (one row per conference x year x
    country, 454 rows, only China/US present) made the generic fallback
    flatten-and-sort-by-share into a genuinely broken chart, not just a
    disclosed simplification: the same conference's own share values
    across many different years sorted next to each other read as "colt,
    colt, colt..." (confirmed real, not hypothetical — that's what
    shipped for months). Replaced with a real per-conference "first year
    China's share reached the US's" computation, honestly labeled "Not
    yet" for the 12 conferences where China hasn't, with regression
    tests locking in the exact colt/cvpr cases that motivated the fix.
  - **FIG512/FIG513's distribution-stats tables** (`toDistributionStats`
    in `exhibitData.ts`, `BoxPlotRow.tsx`) — a real 5-number summary per
    company (min/25th/median/75th/max, plus mean/skewness/kurtosis) that
    the generic fallback flattened to ranking by whichever real-numeric
    column came last (kurtosis, a real but fairly opaque statistic for a
    policy reader), discarding the other 8 real columns. Detected
    structurally (does the exhibit have all 5 real quantile columns?),
    not by exhibit id — a real, recurring shape (2 exhibits share it), so
    fixed at the general level per this section's own rule. Renders a
    real box-and-whisker per row (sqrt-scaled, same "compress a
    real, heavily right-skewed, zero-floored distribution" approach
    `WorldMap.tsx`'s own "count" mode already uses) with a separate
    median tick and mean dot — the gap between them is the whole point
    (FIG512's DeepMind row: median 880, mean 4,110 — a handful of
    outlier papers pull the average roughly 4.7x above the typical
    case), invisible in a single-number ranking.
- **Country-compare and CSV export are both no longer gaps.** Compare
  mode (2026-07-29) is TrackShell's own pin-to-highlight generalized to a
  real pinned SET, round-tripped through `?countries=US,CN` — see the
  "Click-to-pin" note above. CSV export (`csvExport.ts`'s `downloadCsv()`,
  2026-07-28) gives every `ExhibitPanel` a real "Download this exhibit's
  data (CSV)" control in its methodology drawer. Both were real, useful,
  present in the old app in some form, cut from this rebuild's v1 scope
  deliberately rather than ported speculatively before the new model was
  proven — now built for real, not spoken for.
- **No live top-up for the research-output stage.** The report's own
  OpenAlex-derived exhibits (FIG502/503/512/513, etc.) are static, same as
  everything else here — re-wiring a live OpenAlex pull as a supplement is
  possible (the fetch/transform pattern from the old `openalex.ts` is still
  in git history) but wasn't part of this rebuild.

## How to extend

- **Refresh from a new report export** — drop the updated `talent_charts/`
  contents in place, then `npm run import-talent-charts`. Check the console
  output: it prints the real per-stage exhibit counts and which ids were
  skipped: a shrinking count or a newly-skipped id you don't recognize
  means something in the export's shape changed and `inferKind`/`PARTS`
  need a look, not that the run silently succeeded.
- **New analyst notes** — `data/talent/notes.ts`, one `StageNote` per
  stage, newest shown. Editing this file alone changes nothing served —
  `scripts/import-talent-charts.ts` bakes `NOTES` into `public/data/
  talent.json` at import time, so `npm run import-talent-charts` has to
  re-run after a notes edit too, not just after a `talent_charts/`
  refresh (a real gotcha caught doing the 2026-07-29 editorial pass, see
  "Editorial style pass").
- **A recurring bad chart** (wrong `ChartKind`, wrong color mode) — fix it
  at the general level (`inferKind` in the importer, or the mode-detection
  heuristics in `ExhibitChart.tsx`), not with a one-off special case for
  that exhibit's id, unless the exhibit is genuinely unique (see FIG303's
  derivation for what a justified one-off looks like).
- **A new pipeline stage** — add it to `STAGES`/`Stage` in `types.ts`, a
  `CHAPTER_TO_STAGE` mapping (or a new chapter source entirely) in the
  importer, and a new `Track*.tsx` using `TrackShell`. Don't force new data
  into one of the existing 6 if it's genuinely a different stage of the
  funnel — that force-fit is exactly what got the *first* attempt at a
  `talent` vertical (inside the old quantum/AI app, 2026-07-24/25) archived
  for not fitting that app's pipeline shape at all. This rebuild exists
  because the fix was to design the pipeline around what the data actually
  is, not to keep reshaping the data to fit an existing pipeline.

## House style (for any prose: notes, copy, READMEs)

Lyrical but plain. Specific numbers stated without hedging. No colons as
clause separators. Light interpretive touch at paragraph ends, not a
thesis. Avoid the LLM tells (delve, underscore, pivotal, "not just X but
Y", rule-of-three padding). Prefer "is/has" over "serves as/features".
State the fact, stop.

## Commands

```
npm install
npm run import-talent-charts  # reads talent_charts/, writes public/data/talent.json (committed)
npm run gen-continent-map     # regenerate src/lib/continentMap.ts (only if the ISO country list itself changes)
npm run dev
npm run build
npm run typecheck
npm test                      # src/lib/*.test.ts — vitest (vitest.config.ts only excludes tests/, see "Tests")
npm run test:a11y             # tests/accessibility.spec.ts — playwright + axe-core; needs `npm run build` first
```

On a fresh clone, `public/data/talent.json` is already committed — `npm run
dev` works immediately with no fetch/import step needed. Only re-run
`import-talent-charts` after `talent_charts/` itself changes.

## Tests

`npm test` (vitest, zero config file — Vite's own default TS transform is
enough for plain unit tests) runs `src/lib/*.test.ts`: pure-function tests
for the data-transform helpers (`exhibitData.ts`), country name/color
resolution (`countries.ts`), and CSV export (`csvExport.ts`). No jsdom/
happy-dom environment is configured, so these only cover logic that
doesn't touch the DOM — no component-render tests yet, and
`csvExport.ts`'s actual `downloadCsv()` (a thin DOM side effect: create a
Blob, click a synthetic `<a>`) is deliberately untested directly; only its
extracted pure `rowsToCsv()` is. Wired into `.github/workflows/
build-and-deploy.yml` as a real step before `Build` — runs on every push
to `main` and every PR against it (a PR run stops after test+build, never
deploys; see that job's own `if:` guard).

This is a real "zero to something," not "zero to comprehensive." One real
Playwright/E2E suite exists (`tests/accessibility.spec.ts`, `npm run
test:a11y`, see "Accessibility" below) — but most UI verification this
project's sessions have run is still by hand, via scratchpad Playwright
scripts, not committed tests. `ExhibitChart.tsx`'s own dispatch logic
isn't covered, and neither is `sankeyData.ts`'s derived-cohort math. Real
follow-up, not silently considered "done" — grow this file by file as
new logic gets touched, same instinct as everything else in "Known gaps."

**A real bug this test suite caught immediately**: `docs/report-crosswalk-
notes.md` had claimed `codeFromCountryName()` already resolved "South
Korea," "Republic of Korea," and bare "Korea" to the same code. Writing
`countries.test.ts` found that claim was only 2/3 true — the bare word
"Korea" (exactly what FIG608's real data uses) didn't resolve via
`i18n-iso-countries`' own fuzzy matching, so `toCountryMapValues()` was
silently dropping South Korea's real data point from FIG608's world map
the entire time. Fixed with `countries.ts`'s new `EXTRA_NAME_ALIASES`.

## Accessibility

An `axe-core`/Playwright sweep (2026-07-29, scratchpad-only script — not a
committed test yet, see "Known gaps") across all 7 routes found 6 real
violation categories, every one of them a genuine, systemic pattern hit on
every page rather than a one-off: fixed at the general/shared-component
level per this file's own rule, not per exhibit. Re-running the same sweep
after the fixes below returns **zero violations on all 7 pages.**

- **`color-contrast`** — `--mist` (`#718D9B`, a real Hoover-website-derived
  token) only hits 3.5:1 against white/panel backgrounds, short of WCAG
  AA's 4.5:1 for normal text, and it was used as TEXT color everywhere
  (topbar meta, ticker captions, table headers, chart axis ticks, trend
  notes/captions, the footer). Not a one-off tuning call: computed real
  contrast ratios by hand for every candidate token first (see this
  session's own math) before picking a fix, same discipline as every
  other shared-token change in this file. Fixed by swapping every TEXT
  usage of `--mist` to `--slate` (`#43555F`, the SAME real brand family's
  already-existing darker sibling — 7.3-7.8:1 light, 5.1-6.0:1 dark, no
  new color invented) — `--mist`'s own value is untouched, so anything
  still using it for a non-text purpose (`.boxplot-mean`'s marker dot,
  which only needs WCAG's lower 3:1 non-text bar) is unaffected. Also
  caught: `.ticker-sep` used `--line-2` (a border-only token, 1.6-1.9:1)
  as TEXT color — same `--slate` fix. A second, separate real cause
  surfaced only after the first fix (112 nodes on `/graduate-training/`
  alone): `SeriesChart.tsx`'s hidden-series legend toggle used
  `opacity: 0.4` on the whole button to signal "off," which blends
  `--ink-2` down to a measured ~2:1 against a white panel — an opacity
  trick doesn't respect contrast the way a real color swap does. Fixed by
  moving the dimming to `color: var(--slate)` + the existing
  strikethrough on the text, keeping `opacity: 0.4` only on the `.swatch`
  span (a real decorative color match, not text a reader needs to read).
- **`heading-order`** — every page had real content below `<h1>` at
  ONLY `<h3>` (`ChartFrame.tsx`'s `SectionHeader`, used for both a
  `TrackSection`'s own group title and every individual exhibit panel
  title) — a real skipped level, not a false positive: a screen-reader
  user's "jump to next heading" navigation had no real middle tier to
  land on. Fixed by giving `SectionHeader` a real `level` prop (2 or 3,
  default 3) reflecting the page's ACTUAL hierarchy: `<h1>` page title ->
  `<h2>` a TrackShell named section or a stage's one full-width hero
  exhibit -> `<h3>` an individual exhibit panel within either. `TrackShell`
  passes `headingLevel={2}` (a new `ExhibitPanel` prop) to its own hero
  panel and `level={2}` to each section's `SectionHeader`; `Overview.tsx`
  and `TrackRetentionImmigration.tsx`'s own top-level `SectionHeader`s
  (Two Streams, What's Happening, The Retention Gap) do the same. No
  visual change — `.section-header`'s CSS targets the class, not the tag.
- **`landmark-one-main` / `region`** — `BaseLayout.astro` had no `<main>`
  at all (a plain `<div class="wrap">`), so masthead content (logo, ticker,
  page head) sat outside every landmark. Fixed with real `<header>`
  (topbar + news ticker) and `<main class="wrap">` (page head, nav, page
  content, footer) elements — `<footer class="foot">` was already a real
  footer tag, just newly nested inside the new `<main>`. `region` mostly
  resolved as a direct consequence, since axe's `region` nodes were
  exactly the masthead content this same fix now contains.
- **`nested-interactive`** — `WorldMap.tsx`'s outer `<svg role="img">`
  contained per-country `<Geography>` elements with `tabIndex={0}
  role="button"` whenever `onSelect` was wired (i.e. on every real map in
  this app) — an invalid ARIA combination (`role="img"` implies one
  atomic, non-interactive unit). Same bug, independently, in
  `Sankey.tsx`'s outer `<svg role="img">` around its always-clickable node
  `<g role="button">`s. Fixed by making `WorldMap`'s outer role
  conditional (`onSelect ? "group" : "img"` — a real non-interactive mode
  still exists there) and `Sankey`'s unconditional (`"group"` — every node
  is always interactive, no read-only variant to preserve).
- **`svg-img-alt`** — every Nivo-rendered `<svg role="img">`
  (`SeriesChart.tsx`) shipped with no accessible name at all — confirmed
  `ResponsiveLine` forwards a real `ariaLabel` prop straight to its
  internal `SvgWrapper`'s `aria-label` (checked directly against
  `@nivo/core`'s source, not assumed from the type surface). `ExhibitChart.tsx`
  now passes the real exhibit title (or `"{title} — counts"`/`"{title} —
  rate"` for the two-chart count/rate split) through as `ariaLabel` at
  every `SeriesChart` call site. `WorldMap.tsx`/`Sankey.tsx`'s own
  hand-rolled SVGs already had real `aria-label`s — only the Nivo one was
  missing this.

**No longer a gap — committed and wired into CI (2026-07-29).** The
scratchpad sweep above is now `tests/accessibility.spec.ts`, a real
`@playwright/test` suite (`playwright.config.ts`, `npm run test:a11y`)
that runs axe-core against all 7 built routes and asserts zero
violations — the same check, just real and repeatable instead of a
one-off scratchpad run. Verified the suite itself catches real
regressions, not just trivially passing: temporarily reverted the
`nested-interactive` fix on `WorldMap.tsx`, confirmed the test failed
with the exact real violation, then restored the fix and confirmed it
passed again. `.github/workflows/build-and-deploy.yml` runs it as a real
step after Build, before the deploy-artifact upload — `GTM_BASE` is set
identically to the Build step's own value, since `astro preview` serves
`dist/` under that same base path, not root; confirmed by hand that a
mismatch here 404s every route (`curl` against the wrong path returned a
real 404) rather than silently testing something else.

Two real, separate bugs surfaced building this, both fixed at the
general level: Vitest's own default test glob also matched the new
`tests/accessibility.spec.ts` (a `.spec.ts` file), so `npm test` tried
to run it as a Vitest test and errored — needed a real `vitest.config.ts`
(this project's first) to exclude `tests/**`. The naive fix
(`exclude: ["tests/**"]`, a bare array) is wrong on its own: it REPLACES
Vitest's own default excludes rather than adding to them, and Vitest's
default only excludes root-level `node_modules`, not a nested one — this
repo has a real `worker/node_modules/` (a separate nested Node project,
see the Astro migration notes on the news-ticker Worker), and Vitest
started trying to execute `wrangler`'s own bundled test files before
this was caught. Fixed by spreading `configDefaults.exclude` from
`vitest/config` instead of replacing it. Separately, neither
`tsconfig.app.json` nor `tsconfig.node.json` covered the new
`playwright.config.ts` (repo root) or `tests/` at all, so `npm run
typecheck` was silently skipping both — added them to
`tsconfig.node.json`'s `include`, confirmed with a forced (`--force`,
cache-busting) `tsc -b` rebuild that they're now genuinely checked, not
just passing by omission.

## Methodology drawer (2026-07-30)

`src/components/MethodologyDrawer.tsx` replaces `ExhibitPanel.tsx`'s old
bare `<ExpandableMethods><p>{sourceLong}</p></ExpandableMethods>` block
with a richer real-methodology surface, per the publication redesign's
per-chart methodology requirement (tracked in issue #3 on GitHub).

**Real content only, never a placeholder** — checked `content/report-
crosswalk.csv`'s own dedicated `unit`/`population_definition` columns by
hand before building anything: every one of them still reads "TBD" for
every one of the 91 exhibits this app actually renders today (0 real
values). Rather than model fields that would always show "not yet
documented," `Exhibit` (`src/lib/types.ts`) only gained three new
optional fields — `derivedFrom`, `calculationNote`, `dataNote` — each
populated ONLY for the specific, real, already-confirmed cases this
codebase has precise knowledge of:
- **`derivedFrom`/`calculationNote`**: the 6 exhibits computed by this
  site rather than read from a standalone report CSV (FIG303, TAB303,
  FIG405, TAB503, TAB504, TAB605) — each note states plainly that it's
  "computed by this site, not the report," and what the real computation
  is, so a reader never mistakes a derived number for an independently-
  sourced one.
- **`dataNote`**: three real, hand-confirmed data-quality/comparability
  facts — FIG101's real per-year estimate/confirmed flag (previously
  dropped by the importer as non-numeric; now surfaced as a real
  methodology note: "1900-1901, 1916, and 1923 are historical estimates
  ... every other year ... is confirmed") and FIG601-vs-FIG602's
  different populations (intent survey vs. tracked-cohort outcomes —
  already flagged in `docs/report-crosswalk-notes.md`, now surfaced on
  the exhibit itself, not just the Retention & Immigration hero's own
  caption).
- **Date range** is computed at render time from the exhibit's own real
  `rows` (min/max `Year` column value), not stored — never goes stale on
  a data refresh, and simply doesn't render for an exhibit shape with no
  `Year` column (a country-map or ranked-bar snapshot) rather than
  showing a fabricated range.

**A real stale-documentation bug fixed along the way, not a new one
introduced**: `content/report-crosswalk.csv`'s own `caveat`/`notes` text
for TAB605/TAB503/TAB504 still said "not yet backfilled"/"BLOCKED" days
after all three were actually ported (2026-07-29, see the Ingestion
section) — caught while reading this file for real content to reuse,
fixed to say what actually happened instead of re-porting the stale
claim into a public methodology page.

**Accessibility**: reuses the native `<details>/<summary>` disclosure
pattern (`ExpandableMethods` already established this is real, keyboard-
operable, and has no focus trap by construction — a modal/overlay would
have to build that from scratch). Gets a real, stable deep link
(`?methods=<exhibit-id>`, e.g. `?methods=FIG101`) via a `useState`
initialized closed on both server and first client render (the same
SSR-safe pattern as pinned countries) and a mount effect that opens +
scrolls to the right drawer when the URL matches — confirmed working by
hand with Playwright, not assumed. A real `@media print` rule overrides
the same UA-stylesheet selector shape (`details:not([open]) > *`) that
normally hides a closed drawer's content, so a printed page shows every
real citation/methodology text regardless of its on-screen open/closed
state. Confirmed the no-JS fallback separately: `curl`ing the built HTML
shows a real, closed `<details id="methods-FIG303">` with the actual
methodology content already present, not injected by JS.

Not yet built (tracked in issue #5, the full `/methodology/` route):
"copy shareable URL preserving chart state" is intentionally the
simpler `?methods=<id>` link for now, not yet threading through other
real page state (pinned countries, series-picker selections) — that's
this drawer's own smaller piece of a larger, still-open download/share
mechanism.

## Real employer-name normalization (2026-07-30)

`src/lib/entityResolution.ts` — `canonicalizeCompany()` — canonicalizes
FIG302's own real "Company" column so a DERIVED metric like FIG303's
top-10 concentration groups the same real employer together instead of
splitting it across legal-entity-name variants. Adapted from the old
pre-rebuild app's own `entityResolution.ts` (deleted in the talent
rebuild, recoverable via `git show 5329bf1^:src/lib/entityResolution.ts`)
— same two-layer pattern (mechanical legal-suffix stripping, then a
small hand-verified alias table), rebuilt against FIG302's real data
rather than reusing the old quantum/AI-specific alias table, which
doesn't apply here.

**Real research, not speculation** — pulled and reviewed FIG302's full
252-row real employer list by hand (2026-07-30) before writing a single
alias. Exactly one real, confirmed, CONTEMPORANEOUS same-parent case
exists: "HP Enterprise Svcs LLC" and "Hewlett Packard Enterprise
Company" are the same real company at the same time (a subsidiary and
its parent), not a change of ownership — these canonicalize to one
"Hewlett Packard Enterprise." Several REAL historical mergers also
appear in the data (Satyam Computer Services, acquired by Tech Mahindra
in 2013; Larsen & Toubro Infotech + Mindtree, merged into LTIMindtree in
2022) — confirmed with the user (2026-07-30) that these deliberately do
NOT get grouped: pre-merger years stay attributed to the entity that
actually filed them, with the real relationship disclosed instead
(`CORPORATE_LINEAGE` in `entityResolution.ts`) rather than silently
merged into the successor's totals. Merging a historical acquisition
into one grouping would misattribute economic activity across a change
of ownership — a real methodological distinction, not a technicality.

**FIG302's own exported rows are never touched** — canonicalization only
feeds a NEW `canonicalizeFig302()` helper in `scripts/import-
talent-charts.ts`, used by `buildFig303` and `buildTab303` (both already
disclosed as computed-by-this-site derivations, not verbatim exhibits).
FIG302 itself stays exactly as USCIS reported it — the real "raw file
actually used," for the downloads work's own "link to raw source files"
requirement.

**Verified the real before/after, not assumed**: regenerated
`talent.json` and diffed every exhibit. FIG303's top-10 concentration
percentage is IDENTICAL in every year 2009-2026 — Hewlett Packard
Enterprise's combined volume never crossed a top-10 threshold in any
single year, so the one real grouping found didn't move any displayed
number. TAB303's company SET is unchanged (no company added or removed
from the union-of-top-10-firms), only its display names got the same
mechanical suffix-stripping cleanup ("GOOGLE INC" -> "GOOGLE", "TATA
CONSULTANCY SERVICES LIMITED" -> "TATA CONSULTANCY SERVICES"). A
real, low-risk fix that's still worth having: correct grouping now,
before a future data refresh's threshold shifts enough for it to matter.

Real bug avoided, not hit: the recovered old file's own `ALIASES` lookup
used a bare `ALIASES[key]` object index, which the old code's own
comment says once collided with `Object.prototype.constructor` for a
real company literally named "Constructor." `Object.hasOwn` is used here
from the start — confirmed by a real test case
(`entityResolution.test.ts`), not discovered by hitting the bug again.

## Editorial style pass (2026-07-29)

Read the real "Hoover Style Guide April 2026.pdf" (repo root, gitignored
— see "Hoover brand sources") in full and applied its concrete,
checkable rules to this app's OWN authored prose — analyst notes
(`data/talent/notes.ts`), stage blurbs (`src/lib/types.ts`), the
Overview hero headline/KPI labels, and one section title. Deliberately
NOT applied to exhibit data (`title`/`sourceShort`/`sourceLong`/
`columns` on every `Exhibit`) — those are the report's own verbatim
citation text from `titles_and_sources.csv`, and rewriting a source's own
words to match a different house style would break the traceability
this app's whole honesty model depends on (see "Data model").

- **"US," not "U.S."** — the guide's own `United States / US` entry is
  explicit: spell out as a noun, abbreviate with no periods as an
  adjective, and "Use 'US' in place of 'U.S.' even when the latter is
  part of a title in a citation." Fixed the 10 real instances of "U.S."
  across our own prose (confirmed by grep, not sampled): the Overview
  hero headline and two KPI labels, one Foundation section title, one
  `STAGES` blurb, three Sankey node/link labels in `sankeyData.ts`, and
  two analyst notes. Citations/exhibit data untouched per above.
- **En dash for number ranges, not a hyphen** — caught two real cases:
  `data/talent/notes.ts`'s "57,439-57,806 range" and `sankeyData.ts`'s
  "Left between 5-10 years," both fixed to the real en dash (–). Exhibit-
  ID ranges in code comments (`FIG102-105`) are developer-facing, not
  reader-facing prose, and left alone.
- **Spell out single-digit numbers in running prose** — the guide's own
  "online-only materials" exception (this app is one) is more permissive
  than general Chicago style: spell out zero through nine, numerals for
  10 and up. Checked every analyst note by hand against this rule rather
  than blanket-converting: only one real violation existed ("PISA math
  scores sat 7 points below" -> "seven points below"); every other
  digit-count in the five other notes is either already 10+ (correct as
  a numeral), a year (never spelled out), or part of a genuine number
  cluster/comparison spanning a large number in the same clause (CMS's
  own clustering exception — e.g. "rose from 2 to 2,925" reads worse, not
  better, if only the small number were spelled out).
- **Em dash spacing — deliberately NOT touched.** The guide says an em
  dash should be closed up to its surrounding text (`her—on a cold`), but
  this codebase's own established prose voice (every comment, this file,
  every analyst note) uses a spaced em dash (` — `) with total
  consistency across 37 files / 183 instances. That's this project's own
  deliberate register for explanatory/narrative prose, not an oversight
  — converting it wholesale would be a large, high-risk mechanical change
  to a convention that predates this pass and that CLAUDE.md's own
  "House style" section (silent on dash spacing specifically) doesn't
  call an error. Flagged here rather than changed unilaterally; worth a
  real decision from whoever owns this app's voice if it ever comes up
  again, not something to guess at case by case.
- **Real dead code found and removed while checking `U.S.` usages**:
  `src/data/metrics.ts`, a 1,679-line metric registry from Phase 1
  (`5be595e`, "report-to-web crosswalk and metric registry"), had zero
  importers anywhere in the app — confirmed by grep before deleting, not
  assumed. Superseded by the real `Exhibit`/`talent.json` model this
  rebuild actually shipped; deleting it removed dozens of its own now-
  moot `U.S.` instances along with the rest of the dead file.
- **A real gotcha, caught by hand**: editing `data/talent/notes.ts`
  alone did nothing to the served page — `scripts/import-talent-
  charts.ts` imports `NOTES` from that file and bakes it into
  `public/data/talent.json` at import time (`notes: NOTES`, confirmed by
  reading the script), the same as every exhibit. `npm run
  import-talent-charts` has to re-run after ANY `notes.ts` edit, not
  just after a `talent_charts/` refresh — confirmed by grepping the
  built `dist/` output for the old text after a full rebuild still
  showed it, before finding the real cause.
