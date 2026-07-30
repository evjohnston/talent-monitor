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
npm run test:interaction      # tests/interaction.spec.ts — real keyboard/download checks; needs `npm run build` first
npm run test:visual           # tests/visual-regression.spec.ts — scoped pixel-diff snapshots; needs `npm run build` first
npm run test:gallery-hidden   # tests/gallery-hidden.spec.ts — confirms /dev/components/ is hidden in a normal build; needs `npm run build` first
npm run test:gallery          # tests/gallery/*.spec.ts — real gallery content; builds its own PUBLIC_ENABLE_DEV_GALLERY=true dist/ via playwright.gallery.config.ts
npm run review:data           # scripts/generate-data-review.ts — one real record per exhibit, CSV+JSON to dist/dev/data-review/; fails on real data problems; needs `npm run build` first
npm run test:data-review-hidden  # tests/data-review-hidden.spec.ts — confirms /dev/data-review/ is hidden in a normal build; needs `npm run build` first
npm run test:data-review      # tests/data-review/*.spec.ts — real review-sheet content; builds its own PUBLIC_ENABLE_DATA_REVIEW=true dist/ via playwright.data-review.config.ts
npm run test:lighthouse       # lighthouserc.cjs — real, measured Lighthouse budgets (9 routes, 3 runs each); needs `npm run build` first
npm run report:bundle-size    # scripts/report-bundle-size.ts — real per-build JS chunk/data-payload sizes; needs `npm run build` first
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

This is a real "zero to something," not "zero to comprehensive." Three
real Playwright/E2E suites exist — `tests/accessibility.spec.ts` (`npm
run test:a11y`, see "Accessibility" below), `tests/interaction.spec.ts`
(`npm run test:interaction`, real keyboard operation and download-output
checks — see "Interaction, accessibility, and visual-regression tests"),
and `tests/visual-regression.spec.ts` (`npm run test:visual`, a small
scoped set of pixel-diff snapshots, same section) — but most UI
verification this project's sessions have run is still by hand, via
scratchpad Playwright scripts, not committed tests. `ExhibitChart.tsx`'s
own dispatch logic isn't covered, and neither is `sankeyData.ts`'s
derived-cohort math. Real follow-up, not silently considered "done" —
grow this file by file as new logic gets touched, same instinct as
everything else in "Known gaps."

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

## Per-chart downloads (2026-07-30)

`MethodologyDrawer.tsx`'s download menu (issue #4) now offers CSV, JSON,
and SVG, plus copy-citation and copy-methodology-link, alongside the
existing structured metadata fields.

- **CSV/JSON** — `src/lib/csvExport.ts`'s `downloadCsv()` (already real)
  gained a sibling `downloadJson()`; both share a new `triggerDownload()`
  helper instead of repeating the Blob/createObjectURL/synthetic-`<a>`
  sequence per format.
- **SVG** — `src/lib/chartExport.ts`'s `downloadChartSvg()` is ONE
  generic implementation for every chart kind, not per-component code:
  `WorldMap`/`BoxPlotRow`/`BarRow`/`LeaderboardYears`/`Sankey` are all
  hand-rolled real `<svg>` elements, and Nivo's `ResponsiveLine`
  (`SeriesChart`) also renders a real `<svg role="img">` (confirmed
  directly against `@nivo/core`'s source during the accessibility pass,
  see that section above) — serializing whichever real `<svg>` is
  actually in the DOM works identically regardless of which component put
  it there. `ExhibitPanel.tsx` wraps `<ExhibitChart>` in a plain ref'd
  `<div>` (confirmed no CSS targets `.panel`'s children via a direct-child
  selector before adding it) so `MethodologyDrawer` can find that
  exhibit's own chart without needing to know its `ChartKind`. Verified
  against two real, structurally different chart kinds by hand with
  Playwright — a Nivo `SeriesChart` and a hand-rolled `WorldMap` — both
  produce a real, valid, standalone SVG file (own `xmlns`, real `<path>`
  content).
- **Filenames** — no hand-authored slug field exists per exhibit yet (91
  exhibits, real content-authoring work, not invented here), so
  `src/lib/exportFilename.ts` mechanically slugifies the exhibit's own
  real title instead of falling back to its opaque id: e.g.
  `degree-production_how-many-research-doctorates-are-awarded-by-u-s-
  universities_1900-2024.csv`. Reuses `realDateRange()` (already built
  for the methodology drawer) for the trailing date range, converting its
  en dash to a plain hyphen — filenames shouldn't carry a unicode
  character the way display text can.

**"CSV of the currently displayed data," done (2026-07-30)** — no longer
a gap. `SeriesChart`'s own >6-series picker and `LeaderboardYears`' own
year-chip (both already real, existing filters) now report their
currently-visible subset up through a new `onVisibleDataChange` prop on
`ExhibitChart`, the same lifted-state pattern `onHoverCountry`/
`onSelectCountry` already used. `MethodologyDrawer` only renders a second
"Download CSV (currently shown)" button when there's a REAL difference
to download — `ExhibitChart.tsx` itself decides this (reporting `null`
whenever every series is visible, e.g. every exhibit with ≤6 series never
needing a picker at all), not a downstream heuristic guessing from row/
column counts. Verified by hand across two real different exhibit shapes:
a >6-series timeseries exhibit (same row count, fewer columns — the
picker's default 6 of N series) and FIG302's leaderboard-years shape
(fewer rows AND fewer columns — one year, top-12 ranked, vs. every
year/every of 252 employers). Confirmed the split is correctly absent
everywhere else by sweeping every panel on two real stage pages.

Not yet done (tracked in #4): the count/rate-split path (`FIG603`-style
exhibits mixing a real 0-1 rate column with count columns, rendered as
two independent `SeriesChart`s) doesn't report a visible-data subset —
each half has its own independent picker state, and merging two
partially-independent subsets into one coherent CSV wasn't tackled in
this pass, a real, smaller, disclosed gap, not silently papered over.

**Build-time PNG/ZIP pipeline, done (2026-07-30)** — closes #4.
`scripts/generate-downloads.ts` (`npm run generate-downloads`) runs
AFTER `astro build`, spins up a real `astro preview` server on its own
port (4322, deliberately not 4321 — avoids colliding with a real dev/
test server already on the default port), and:
- **ZIPs** — one per stage, bundling that stage's real exhibit CSVs
  (`archiver`'s `ZipArchive` — a newer, class-based API than the classic
  `archiver('zip', opts)` factory-function call; confirmed by reading the
  installed package's own real source, not assumed from memory of older
  versions). No browser needed for this half.
- **PNGs** — a Playwright-driven screenshot of each exhibit panel's own
  real `<svg>`, one pass per stage page. Only 62 of 91 exhibits get a
  real PNG — confirmed this is CORRECT, not a bug: `BarRow` (the ranked-
  bar fallback, ~29 exhibits) is plain HTML/CSS with no `<svg>` at all,
  so there's genuinely nothing to screenshot for those.

**A real, separate bug this surfaced, fixed in the same pass**: the
client-side "Download SVG" button in `MethodologyDrawer.tsx` was ALWAYS
rendered regardless of chart kind — for every one of those same ~29
`BarRow` exhibits, clicking it silently did nothing (no real `<svg>` for
`downloadChartSvg` to find). Fixed with a post-mount check
(`chartRef.current?.querySelector("svg")`) that hides the button
entirely when there's truly nothing to export — verified by hand across
every panel on a real stage page that "has a real `<svg>`" and "shows
the SVG button" match exactly, not just spot-checked.

**A second real bug caught by hand reviewing the first generated PNGs,
not assumed**: `WorldMap.tsx`'s own corner "expand" button sits visually
on top of the map, not inside its own separate box — the very first test
PNGs had that button's own square baked into the exported image. Fixed
by injecting a temporary `display: none` style rule for `.map-expand`
right before each stage's screenshots (`page.addStyleTag`, scoped to the
screenshot pass only, never touching the real served page).

**Node-context/browser-context import split, a real architectural fix,
not a workaround**: `scripts/generate-downloads.ts` needs `rowsToCsv`
and `buildExportFilename`/`realDateRange`, but importing them from
`csvExport.ts`/`exhibitData.ts` directly failed `tsc`'s Node-context
project (`tsconfig.node.json`, no DOM lib, no `--jsx`) — those files also
contain `document`/`Blob`-using functions and type-only imports from real
`.tsx` component files respectively, and tsc checks a whole file's
syntax against its project's settings regardless of which specific
export a caller actually uses. Fixed at the root, not papered over with
a duplicate copy: `realDateRange` moved to a new `src/lib/dateRange.ts`,
`rowsToCsv` to a new `src/lib/csv.ts` — both genuinely dependency-free,
re-exported from their original files for every existing browser-context
import site to keep working unchanged (confirmed: `npm test` still
passes all 65 tests with zero import changes needed elsewhere).

CI wiring: a real step in `.github/workflows/build-and-deploy.yml` after
the accessibility check, guarded `if: github.event_name == 'push'` (same
as the deploy-artifact upload) — a PR's own status-check run doesn't pay
the cost of generating downloads that will never actually deploy.

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

## Responsive and reduced-motion sweep (2026-07-30)

Closes #8. Most of this stage's own requirements were already satisfied
by construction in #7 (the scrollytelling's mobile layout is the same
plain stacked order the no-JS fallback uses, no separate "mobile mode"
to verify) — this pass is the real, systematic check across every route
this session touched, not an assumption that "should be fine" was
actually true.

**Checked, not assumed**: a real Playwright sweep of all 9 routes at
mobile (390×844) and tablet (768×1024) found zero horizontal overflow —
including with every methodology drawer opened at once on
`/graduate-training/` (the >6-series picker's own widest real button
row) and after scrolling through every real step of the Overview
sequence on mobile. The wide real tables (`/methodology/`'s 163-row
crosswalk, `/downloads/`'s 91-row exhibit table) also introduce no
horizontal page overflow.

**A real touch-target gap found and fixed, not left at "probably
fine"**: `.chip`/`.pill`/`.ghost-btn` — this app's single most-reused
interactive class, used everywhere from year-chips to nav tabs to the
new scrollytelling field/metric selectors — measured at a real 23px
tall, 1px under WCAG 2.5.8's 24px minimum target size. Fixed by bumping
vertical padding from 4px to 5px (23px -> 25px, confirmed by hand after
rebuilding), a small, shared fix rather than a per-component patch.
Verified no visual regression from the 2px height change across the
main nav and a real series-picker legend after the fix.

`prefers-reduced-motion` confirmed working for real, not just assumed
from earlier sessions' own claims: emulated `reducedMotion: "reduce"` in
a real browser context and confirmed the page actually sees the media
query as true, zero Sankey particle-dot elements render (the existing
`usePrefersReducedMotion` gate, reused unchanged by the two Sankeys the
Overview sequence itself reuses), and `scroll-behavior` computes to
`auto`, not `smooth` (the existing global reduced-motion override).
Nothing new this session introduces its own scroll-triggered or
decorative animation to gate — the scrollytelling's core mechanic is
plain CSS `position: sticky`, which isn't an animation at all.

## The /explorer/ route — foundation (2026-07-30)

Closes the "explorer foundation" stage of #18, the fifth of six features
deliberately deferred when the methodology/downloads/overview backlog
(#2) closed — see `docs/CLAUDE_CODE_SIX_DEFERRED_FEATURES.md` and
tracking issue #13. `src/lib/metricRegistry.ts` (the real registry,
finally giving one a real caller — see below), `src/lib/
explorerUrlState.ts`, `src/pages/explorer.astro` + `src/dashboards/
Explorer.tsx`. Per the six-deferred-features roadmap's own staging
(explorer foundation → indicator detail → compare mode, 3 separate PRs),
this is PR 1 of 3 for issue #18 — search/filter/catalog/URL state only;
a focused in-page indicator detail view and compare mode are real,
tracked follow-up work, not attempted here.

**A real, minimal metric registry — the caller the first attempt never
had.** `src/data/metrics.ts` (the original overhaul doc's own Phase 1.4,
1,679 lines) was deleted as confirmed dead code with zero importers (see
"Editorial style pass"). `metricRegistry.ts` is a genuinely small,
different thing: one function, `buildMetricRegistry(exhibits)`, deriving
`topics`/`measureType`/`geography`/`dateRange` from each of the 91 real
exhibits' own real shape — no separate schema file to keep in sync by
hand, since it's recomputed from `talent.json` every time.

**Topics are mechanically derived from the 91 real exhibit titles, not
ported from the scope doc's own generic topic list.** Read every real
title by hand first (`node -e '...exhibits.map(e => e.title)'`), then
wrote keyword-matching rules against what's ACTUALLY there — "AI
companies and founders" instead of the doc's bare "Founders" (several
real titles are about company-level global staffing, not literally
founders), "College completion" broadened to catch "which fields keep
their students" (the report's own inverse framing of attrition), etc.
Verified by hand: 0 of 91 real exhibits fall through to the "Other"
fallback topic.

**`measureType`/`geography` are derived from each exhibit's own real
`ChartKind`/columns**, not a hand-authored tag per exhibit — e.g.
`country-map` exhibits are always `world` geography, a `Company`/
`Institution`/`Employer` column always means `institution-or-company`,
checked against the real 91-exhibit corpus (58 us-only, 14
field-or-category, 10 country-comparison, 5 institution-or-company, 4
world).

**Real sparkline previews, only where a real single trend line
exists** — `timeseries`/`share-timeseries` exhibits get a real
`Sparkline` (already built for the Overview's KPI cards, reused
unchanged) drawn from that exhibit's own first real numeric column;
every other real `ChartKind` (ranked-bar, leaderboard-years,
country-map) has no single trend to preview and simply shows none,
rather than fabricating a misleading line.

**Each catalog result's "Open →" reuses the existing methodology
deep-link mechanism** (`?methods=<id>`, see "Methodology drawer") to
jump straight to that exhibit's own real panel on its real stage page,
auto-opening and scrolling to its drawer — verified by hand with
Playwright, not assumed. This is a deliberate, disclosed interim
behavior for this first PR; a real focused in-explorer detail view
(chart, table, methods, downloads, all without leaving `/explorer/`) is
PR 2 of 3.

**A real test-writing bug, not an app bug, caught and fixed the same way
the data review sheet's own Show/Hide locator bug was** — the first
version of the "Open link deep-links correctly" test asserted against
`.first()` in DOM order, but a search result's real stage-page position
isn't necessarily first in that page's own real render order (FIG302
isn't first on `/workforce-entry/`). Fixed by deriving the exact expected
drawer id from the clicked link's own `href` instead of guessing at DOM
position.

**Real no-JS content, verified by hand, not assumed** — `curl`ing (well,
`grep`ping) the built `dist/explorer/index.html` directly confirms all
91 real result rows are present in the static HTML, same as every other
page in this app; only the filter/search INTERACTIVITY needs JS, not the
underlying content itself.

Wired into `DashboardNav.astro`'s reference row (Explorer, before
Methodology/Downloads), `urlState.ts`'s `Dashboard` type,
`tests/accessibility.spec.ts`'s route list (now 10 routes, 0 violations),
and `lighthouserc.cjs`'s route list.

## The /explorer/ route — indicator detail (2026-07-30)

Closes the "explorer indicator detail" stage of #18 — second of the
three planned PRs (foundation → indicator detail → compare mode).
`src/components/ExplorerDetail.tsx`, `src/components/ExhibitTable.tsx`
(new, generic table alternative for any real `ChartKind`), `?metric=<id>`
added to `explorerUrlState.ts`.

**Reuses `ExhibitPanel` directly for the "full chart" requirement** —
the real chart, its real controls (series picker, annotations), and its
real `MethodologyDrawer` (citation, CSV/JSON/SVG downloads) are exactly
what every stage page already renders per exhibit; the detail view is
not a second, parallel chart-rendering path. The only genuinely new
pieces are the chart/table toggle and the related-indicators list.
"Report presets" (the source issue's own wording) aren't a separate
mechanism for the same reason — this view's default state already
reproduces the report's own real figure/table exactly, since that's
just what `ExhibitPanel` always renders; a separate preset system would
duplicate that, not add to it.

**A full-page swap, not a side panel** — selecting a result replaces the
catalog with the detail view entirely (a "← Back to explorer" link
returns), rather than a split-pane layout. The issue's own wording says
a side panel "may" be used on wide screens, not that it must be; a full
swap is simpler to build correctly and avoids a separate, harder
responsive-layout problem for a first detail-view pass.

**Real browsable/shareable navigation, not just a state variable** —
opening or closing the detail view uses `pushState` (a real, back-
button-undoable navigation a reader would expect), while ordinary
catalog filter changes (typing in search, clicking a dropdown) keep
using `replaceState` to avoid spamming history per keystroke — the same
real distinction this app's other URL-state code (pinned countries,
scrollytelling) never needed, since neither of those has a real
sub-view to navigate into. A `popstate` listener re-reads the URL on
back/forward so the catalog-vs-detail swap responds to real browser
navigation, not just this component's own button clicks — verified by
hand with Playwright (`page.goBack()` genuinely returns to the catalog).

**Real related indicators** — ranked by real shared topics (from
`metricRegistry.ts`, plus a same-stage bonus), capped at 5, never
including the entry itself — confirmed by hand that FIG101 (a degree-
production doctorate count) surfaces five other real degree-production
indicators, not an arbitrary or empty list.

**A real, expected test update, not a bug in either direction** — PR 1's
own interaction test asserted that "Open →" navigates away to the real
stage page (the only behavior that existed then). Clicking now
`preventDefault()`s and opens the in-page detail view instead once JS is
running — the `<a href>` itself is untouched and still points at the
real stage page's `?methods=<id>` deep link, so a no-JS reader (or a
crawler) still gets a real, working link; only the JS-enhanced click
behavior changed. Updated that test to assert the new real behavior
rather than leaving it to silently break.

**Real, dedicated accessibility coverage for the detail view's own
state** — `tests/accessibility.spec.ts` gained a check against
`?metric=FIG101` specifically, since the plain per-route sweep only ever
loads each URL with no query string and would never otherwise exercise
this real, JS-driven view (chart/table toggle, related-indicators list)
at all. Zero violations.

## The /explorer/ route — compare mode (2026-07-30)

Closes #18 entirely — third and final of the three planned PRs
(foundation → indicator detail → compare mode). `src/components/
ExplorerCompare.tsx` (new), `isCompatibleForCompare`/`canAddToCompare`
added to `metricRegistry.ts`, `compare`/`view` fields added to
`explorerUrlState.ts`.

**Side-by-side independent panels, never one shared/merged chart** — the
source issue's own "do not create an invented composite index" rule
rules out plotting several real datasets onto one shared axis. Selecting
up to `MAX_COMPARE` (4) indicators renders each as its own real,
independent `ExhibitPanel` (own axis, own units, own `MethodologyDrawer`)
in a grid — comparison here means "look at these side by side," not "we
computed something new by combining them."

**Compatibility gated on `measureType` alone, deliberately not a deeper
unit taxonomy** — `isCompatibleForCompare` in `metricRegistry.ts` blocks
mixing e.g. a `timeseries` count with a `geographic` map. This is a real,
meaningful signal without inventing a broader compatibility system this
app's data doesn't need yet, since the actual risk it guards against
(comparing genuinely incomparable shapes side by side) is smaller once
each exhibit keeps its own independent chart rather than sharing one
axis. `canAddToCompare` additionally blocks re-adding an already-selected
id and anything past the real 4-item cap — a disabled `Compare` chip
carries a real `title` tooltip explaining why, not a silent no-op.

**State round-trips through the URL the same way indicator detail
does** — `?compare=A,B,C,D&view=compare`, comma-split and capped at 4 on
read so a hand-edited or stale link can't force more than the real UI
ever allows. Selecting/deselecting a compare candidate uses
`replaceState` (same as ordinary filter changes); opening/closing the
full compare view uses `pushState` (a real back-button-undoable
navigation), matching indicator detail's own real/ordinary distinction.
Compare view wins over indicator detail when both are somehow present in
the URL at once (`Explorer.tsx` checks `view === "compare"` first) — a
reader who explicitly asked to compare shouldn't have that state
silently dropped by a stale `?metric=`.

**A real heading-order bug, caught by the new dedicated a11y check, not
shipped blind** — `ExplorerCompare.tsx`'s panels initially called
`ExhibitPanel` with no `headingLevel`, defaulting to `<h3>` directly
under the page's own `<h1>` — the exact skipped-level pattern already
described in this file's "Accessibility" section above, just
reintroduced in a new component that didn't exist when that sweep ran.
Fixed by passing `headingLevel={2}`, matching `ExplorerDetail.tsx`'s
already-correct convention. Caught because `tests/accessibility.spec.ts`
gained a real check against `?compare=FIG101,FIG103&view=compare`
specifically (the plain per-route sweep never loads this JS-driven query
state) — it failed on the first run with the real violation, confirming
the check catches a real regression and isn't just trivially passing.

**A real Playwright locator bug, caught while writing the interaction
test, not a bug in the app** — `getByRole("button", { name: "Remove
from comparison" })` never matched the real button, because its
accessible name is `Remove ${exhibit.title} from comparison` — Playwright's
string `name` matcher requires a contiguous substring, and a real exhibit
title sitting in the middle breaks that match. Fixed the test with a
regex (`/^Remove .+ from comparison$/`), not the app's own aria-label,
since the label itself (naming which exhibit each button removes) is the
correct, more accessible choice for a screen-reader user comparing
several panels at once.

## Country profiles — framework (2026-07-30)

Issue #19, sixth and last of the six deferred features. Per the
roadmap's own PR sequence (framework -> US/China/India -> remaining 6 ->
compare/downloads/polish), this is PR 9 of the planned 12: `src/lib/
countryProfiles.ts` (the real per-country config engine), `src/
components/CountryProfile.tsx`, `src/pages/countries/index.astro` +
`src/pages/countries/[slug].astro`, `countrySlug()`/`codeFromCountrySlug()`
added to `countries.ts`.

**No hand-authored 91×9 grid — eligibility is computed from the real
imported data**, same discipline `metricRegistry.ts` already established
for topic/measureType/geography. `exhibitCountryCodes(exhibit)` scans an
exhibit's own columns/rows for two real shapes, checked by hand against
every one of the 91 exhibits before trusting either: a "wide" shape (a
column HEADER is itself a country — FIG411's per-country columns) and a
"long" shape (a non-numeric column's own VALUES are country names —
FIG512's "Country" column, and FIG410's real entity column, which is
misleadingly named "Year" but genuinely holds country names as rows).
An exhibit with neither (55 of 91) is treated as implicitly about the
United States (`isImplicitlyDomestic()`) — this report is about the US's
own STEM pipeline, so a plain "Year -> doctorates awarded" series with no
country dimension at all is a real US-domestic statistic, not a gap.

**A real header-matching gap found and fixed before it under-counted
China/India/US everywhere they actually appear**: a first pass caught
only a column header that IS a country name outright, missing three real,
confirmed composite conventions this report's own data actually uses —
`"US_Count"`/`"CN_Share"` (FIG504), `"pct_papers_with_us"` (FIG503), and
`"China: EB1"` (TAB605). Extended `resolveHeaderCountryCode()` with three
narrow, hand-confirmed patterns (text before a real colon; an UPPERCASE
2-letter prefix before `_`; a lowercase 2-letter suffix after `_`) rather
than a generic token scanner — a first attempt at a case-insensitive
suffix match also caught FIG511's real `"USD_PPP_BN"` as "Brunei," which
is actually a unit label ("$ billions"). The real distinguishing signal,
confirmed by checking every numeric column header across all 91 exhibits
before finalizing: this report's own per-country suffixes are always
lowercase snake_case, its unit/acronym suffixes always uppercase — so the
suffix pattern is deliberately lowercase-only, which fixed the false
positive with zero loss of the 3 real cases it exists for.

**A real classification bug in metricRegistry.ts's own topic-priority
order, caught by hand-inspecting the real US profile output, not
assumed correct from the mechanism alone**: FIG601/602/608/609/TAB601/602
(all genuinely about retention) were landing under "Talent production"
instead of "Retention and immigration." Cause: these titles mention
"PhD," which also matches the broader `/degree|doctorate|phds?/i`
pattern for "Degree production" — a pattern that happens to sit earlier
in `TOPIC_RULES`' own declaration order, so naively taking
`entry.topics[0]` picked the wrong one. Fixed with an explicit
`SECTION_PRIORITY` list (most-specific topic checked first — OPT/PERM/
retention before degree production) rather than trusting array order,
which is tuned for a different job (showing every relevant topic as an
explorer pill, where showing extra topics is harmless). A second,
same-shaped bug: FIG208 (postdoctoral positions) landed under "Patents
and R&D" because its own citation ("Postdocs at Federally Funded R&D
Centers") matches `/r&d/i` — fixed by ranking "Graduate and postdoctoral
training" above "R&D"/"Patents" in that same priority list. Also
extended metricRegistry.ts's own "Retention and stay rates" pattern to
catch TAB602's real title ("...Plan to Do After Graduation..."), a
genuine gap independent of the priority-order bug — fixed at that general
level since it also corrects that exhibit's topic pills in the explorer,
not just this page. Both bugs are now regression tests in
`countryProfiles.test.ts`.

**Sections are either real, missing, or absent — never silently
skipped**: a section renders with real content when this country has ≥1
eligible exhibit in it; renders a plain "not available" notice when the
section is "universal" (some OTHER real exhibit proves the report
collects this indicator cross-nationally) but this specific country has
none; and is omitted entirely only when the section is inherently
domestic-natured (populated solely via the US's implicit-domestic
bucket, e.g. H-1B employer data) — that's a structural mismatch, not a
coverage gap, so a non-US profile never shows a false "missing" notice
for a metric that was never conceptually about it. This is why the
issue's own "US may have additional domestic-pipeline sections" and "do
not force identical section counts" rules both hold without contradicting
each other.

**Real, template-generated summaries only** — `buildSummary()` never
free-writes; it picks the country's own earliest-chapter eligible
exhibit (report order, a deterministic tie-break, not "the biggest
number") and states its real latest value, year, and title, or the
template's own explicit "the report does not contain a comparable
indicator series for X" when there's nothing eligible at all.
`formatIndicatorValue()` (shared between the summary and each section's
supporting-metric callouts) reuses `ExhibitChart.tsx`'s own real 0-1-
fraction detection so a share-timeseries exhibit reads "21%," never a
bare "0.21," in either place — caught by hand reviewing the real
rendered US profile, not assumed correct from the data-flow alone.

**One primary chart, up to two supporting metrics, per section** — the
issue's own "not a dashboard card wall" rule: a section's first eligible
exhibit renders as a full, real `ExhibitPanel` (with that country cross-
highlighted via the existing `emphasize` prop, no new visual language);
up to two more render as compact stat callouts (`SupportingMetric`,
latest value + year, linking to that exhibit's own real stage-page
`?methods=<id>` drawer) rather than three equally-weighted full charts.
Anything beyond that links to "the full explorer" — deliberately a
plain, unfiltered link for now, not a guessed query string: the
explorer's own search matches exhibit titles/sources/topics, not this
page's section labels, so a real filtered deep link needs its own
dedicated wiring, planned for PR 12 ("explorer deep links"), not built
here as a half-working guess.

**Country selection is a real link list, not a map** — `/countries/`
lists every currently-enabled country as a plain `<a href>`, satisfying
the issue's own accessibility requirement directly; a stage page's own
`WorldMap` is still there for a geographic view of any single indicator,
but choosing WHICH country's profile to open never requires a map click.

**Staged rollout via a real, disclosed gate, not a fake feature flag** —
`ENABLED_PROFILE_CODES` (currently `["US"]`) controls which countries
`getStaticPaths()` actually builds a route for; an unbuilt slug 404s like
any other unknown route. Every enabled country's profile is fully real
end to end (same as every other route in this app) — this gates WHICH
countries ship, not how complete a shipped one is. China, India, and the
remaining 6 follow in PRs 10 and 11 per the roadmap, each requiring real
hand verification against that country's own actual data before its
route is enabled, the same discipline that caught the two classification
bugs above on the US profile.

Not yet built (explicitly deferred to PR 12, "compare, downloads, and
polish," per the roadmap): country compare mode, per-profile CSV/JSON/
metadata downloads, real filtered explorer deep links, canonical page
metadata/social titles, and a final print/no-JS/performance pass beyond
what this PR already verified (zero axe-core violations on both new
routes; real no-JS content confirmed by `curl`ing the built HTML).

## Lighthouse performance budgets (2026-07-30)

Closes #17, the fourth of six features deliberately deferred when the
methodology/downloads/overview backlog (#2) closed — see `docs/
CLAUDE_CODE_SIX_DEFERRED_FEATURES.md` and tracking issue #13.
`lighthouserc.cjs` (`@lhci/cli`, `npm run test:lighthouse`),
`scripts/report-bundle-size.ts` (`npm run report:bundle-size`).

**Every threshold is a real, measured number, not copied from the source
scope doc's own generic placeholders.** Ran `npx lhci autorun` by hand
(3 runs/route, LHCI's own median-of-N aggregation) against a real
production build before writing a single assertion. The real median
baseline: Accessibility 0.96-1.00, Best Practices 0.93-0.96, SEO 1.00
across every one of the 9 real routes; Performance 0.42-0.73 under
Lighthouse's own default mobile-simulated throttling — a real, disclosed
gap (tracked in follow-up issue #23 with the exact per-route numbers),
not hidden behind an inflated threshold. Copying the scope doc's own
proposed `>= 0.85` Performance floor verbatim would have failed every
single route on day one — exactly the "permanently failing CI job"
anti-pattern that issue's own text explicitly warns against.

**A real, second discrepancy caught checking WHY accessibility wasn't a
perfect 1.00 everywhere**: `/downloads/` scores 0.96, losing 0.04 to
Lighthouse's own `target-size` audit flagging its dense 91-row table's
inline text links. This is the SAME real WCAG 2.5.8 exemption (inline
links within a text block don't need the 24×24 minimum target size)
already reasoned through and confirmed correct during the 2026-07-30
responsive/reduced-motion pass — `tests/accessibility.spec.ts`'s own
axe-core sweep already passes 0 violations on this exact route. Lighthouse's
automated check simply doesn't apply that same nuance. Rather than set
Accessibility's floor at the real observed 0.96 (leaving only 0.01 real
margin against ordinary run-to-run variance — not a stable gate), it's
set at 0.90, still a genuinely high, meaningful bar.

**Verified the gate actually fails on a real breach, not assumed** —
same discipline as every other test-suite addition this session:
temporarily set an impossible `minScore: 0.99` for Performance, reran,
confirmed a real `Assertion failed. Exiting with status code 1.` with
the actual measured score printed, then restored the real config.

**A real config-format bug, fixed twice, not once** — a static
`lighthouserc.json` can't read `GTM_BASE` (the same real base-path
problem `playwright.config.ts`'s own comment already documents, fixed
here the same way: a `.js`/`.cjs` config computing the URL list at
require-time instead). The FIRST fix (`lighthouserc.js`) still failed
for a real, different reason: this repo's `package.json` declares
`"type": "module"`, so a `.js` file using CommonJS `module.exports`
throws `ReferenceError: module is not defined in ES module scope` —
confirmed by hand, not guessed. Renamed to `.cjs`, which forces CommonJS
regardless of that setting; a real, subtle process mistake was also
caught here (editing the config file while an earlier background `lhci
autorun` was still mid-run corrupted that run's own assert step with
"No assertions to use" — fixed by never touching the config file while a
run is in flight, and rerunning clean).

**`scripts/report-bundle-size.ts`** — a real, visible per-build report of
every JS chunk's actual size (30 real chunks, ~1.46MB total, largest
`vendor-nivo` at 400KB) plus `public/data/talent.json`'s own real payload
size (1.15MB) — flagging anything past the same real 800KB threshold
`astro.config.mjs`'s own `manualChunks` split already established (see
"Build chunking"). Deliberately a visibility report, not a historical
byte-diffing budget system — the scope doc's own "prevent unexplained
growth above N%" ask needs a committed baseline to diff against, which
is real, larger follow-up work, not invented here as a half-built
mechanism with nothing real to diff against yet.

CI wiring: `npm run test:lighthouse` runs as a real, BLOCKING gate
(unlike the non-blocking visual-regression step — a threshold breach
here is a genuine measured regression, not cross-machine pixel noise),
positioned after the "Rebuild for production" step so it always audits
the real, flag-off production build, never a dev-tool-flagged one.
`npm run report:bundle-size` runs alongside it as a real, always-visible
log line, not a silent number nobody checks.

**A real correction, caught by an actual CI failure, not local
testing** — adding the `/explorer/` route (see below) triggered the
first genuine failure of this gate on real `ubuntu-latest` CI: Total
Blocking Time on `/graduate-training/` measured 4879-5248ms and on
`/research-output/` measured 3005-4021ms — roughly 3x this session's own
local-Mac baseline (1348-1721ms) for those exact two pages. The original
2500ms TBT threshold's own comment already anticipated "margin for CI's
own runner likely being slower," but guessed at that margin rather than
measuring it — the real gap turned out to be far larger than assumed.
Fixed with real numbers this time: TBT's floor moved to 6000ms (real
headroom above the actual observed CI worst case), and Performance's
floor lowered from 0.3 to 0.15 defensively, since TBT is a heavily-
weighted input to that score and the same CI-vs-local gap plausibly
applies there too even though that specific assertion hadn't failed yet.
The lesson generalizes: a budget "verified" only on a contributor's own
machine isn't verified against the environment that actually enforces
it — real CI dispatch is what caught this, the same discipline behind
every other test-suite addition this session.

## Data review sheet (2026-07-30)

Closes #16, the third of six features deliberately deferred when the
methodology/downloads/overview backlog (#2) closed — see `docs/
CLAUDE_CODE_SIX_DEFERRED_FEATURES.md` and tracking issue #13.
`src/lib/dataReview.ts` (pure record-building + validation),
`scripts/generate-data-review.ts` + `npm run review:data` (CLI,
CSV/JSON output), `src/pages/dev/data-review.astro` +
`src/dashboards/DataReview.tsx` (the human-readable review page).

**One real record per exhibit (91 total)**, computed from
`public/data/talent.json` and `content/report-crosswalk.csv` — never a
second hand-maintained spreadsheet. `population`/`unit` are left blank
rather than fabricated (the crosswalk's own dedicated columns for these
are still "TBD" for every exhibit, same real gap the Methodology drawer
work already documented). Primary-series stats (first/last/min/max
value, absolute/relative change) come from the exhibit's own first real
numeric column — a disclosed simplification for multi-series exhibits,
not a per-series breakdown.

**A real, structural bug caught building the duplicate-key check, not a
hypothetical one**: the first version's `primaryKey()` special-cased "a
Year column exists → use Year alone as the row's identity," which
silently collapsed every real MULTI-dimension exhibit (FIG510/FIG511,
keyed by Year+Country+Category; TAB604, keyed by Country+Year+Status;
TAB501, keyed by conf_norm+conference+year+country) into thousands of
false "duplicate" rows the instant this tool ran against real data.
Fixed by dropping the special case entirely — the composite key is
always every column `numericColumns()` doesn't already exclude, which
correctly reduces to "Year alone" for an ordinary single-series
timeseries and the real full dimension set otherwise.

**A real, second bug the fixed check then caught for real, in the actual
committed data — not a test fixture**: with the key logic corrected, the
review sheet still failed on FIG512/FIG513 (29 duplicate keys each). The
real cause: `talent_charts/data/FIG512.csv`/`FIG513.csv` are Flourish
exports with 28 fully-blank trailing rows plus one literal `Made with
Flourish` attribution row baked into the CSV itself (`grep -rl
"Flourish" talent_charts/data/` matches exactly those two files, no
others) — 29 junk rows out of 35 total, only 6 real company rows. Fixed
at the importer (`scripts/import-talent-charts.ts`'s new
`isBlankOrWatermarkRow`), the same "fix at the general level, not per
chart" rule already applied to Grand Total footer rows — confirmed the
real page's own `BoxPlotRow` rendering was unaffected (it already
required real numeric values to render a row, so this was invisible on
the live site) and all 91 exhibits now pass `npm run review:data` with
zero errors.

**Same dev-only visibility pattern as the component gallery (#14), a
separate flag** — `PUBLIC_ENABLE_DATA_REVIEW=true`, not the gallery's
own `PUBLIC_ENABLE_DEV_GALLERY`, since a reviewer may want one internal
tool on without the other. A normal production build ships only the
plain "not available" placeholder. Its own `playwright.data-review.
config.ts` (mirroring `playwright.gallery.config.ts`) rebuilds with the
flag on to test the real content; `tests/data-review-hidden.spec.ts`
checks the flag-off placeholder using the main config's own server.

**A real test-writing bug caught and fixed while building the keyboard
test, not an app bug**: `getByRole("button", { name: "Show" }).first()`
re-resolves on every call — the instant the first row's button is
activated, its own accessible name changes to "Hide," so a SECOND
`.first()` query for a button "named Show" silently shifts to the NEXT
row's still-unexpanded button, making the test look like the click did
nothing when the app was working correctly the whole time (confirmed by
hand with a real screenshot before chasing a nonexistent app bug). Fixed
by pinning the locator to a specific `<tr>` first, then querying within
it, so the reference stays stable across the state change.

CI wiring mirrors the gallery's own real pattern exactly: a hidden-in-
production check against the shared flag-off build, an own-rebuild
content check (non-blocking, artifact-uploaded on failure), and a single
shared "Rebuild for production" step that now runs after BOTH the
gallery's and the data review sheet's own-flag builds, restoring the
real flag-off `dist/` before downloads generation or the deploy artifact
ever run. `npm run review:data` itself runs as a real, BLOCKING CI step
(unlike the two dev-only HTML pages) — a genuine regression gate: if a
future `talent_charts/` refresh reintroduces a duplicate-key problem, a
missing source, or a derived exhibit with no calculation note, CI fails
before it ships, not after a human happens to notice.

## Data-driven annotation system (2026-07-30)

Closes #15, the second of six features deliberately deferred when the
methodology/downloads/overview backlog (#2) closed — see `docs/
CLAUDE_CODE_SIX_DEFERRED_FEATURES.md` and tracking issue #13.
`src/lib/annotations.ts` (schema + registry), `SeriesChart.tsx` (Nivo
marker + real accessible list), `ExhibitChart.tsx`/`ExhibitPanel.tsx`/
`TrackShell.tsx` (threading), `DashboardContext.annotations` (built once
per page in `buildContext.ts`, same pattern every other context field
already uses).

**Exactly 5 real annotations, not padded to a rounder number** — every
one traced to this app's own already-imported exhibit data or the
report's own R chart-generation source, never inferred from a line's
shape:
- **FIG409** (`event`, 2021, "COVID-19") — the report's OWN R code
  (`talent_charts/figures.Rmd`, Figure 4.09) places this exact
  `annotate("text", x = 2021, label = "COVID-19", ...)` on this chart.
  Found by grepping `figures.Rmd`/`tables.Rmd` for real `annotate()`/
  `geom_vline()` calls — the only genuine event-style annotation among
  several dozen `annotate()` calls found (the rest are direct series
  labels like "All industries"/"Tech occupations," not events).
- **FIG109/FIG110** (`projection_start`, 2021) — computed, not
  hand-typed: the real last year either exhibit's plain observed column
  is non-null (2020) and the first year its own "(projected)" column is
  non-null (2021). Same real projection convention already documented in
  the Methodology route's "Projection methods" section.
- **TAB501** (`crossing`, CVPR, 2019) — reuses `computeAiConferenceCatchUp()`
  directly rather than recomputing by hand, so it can never drift from
  what that chart itself already reports. TAB501 isn't a `SeriesChart`
  (it's the bespoke `BarRow`-per-conference branch in `ExhibitChart.tsx`)
  — its annotation renders as a plain `trend-note` in that same branch
  rather than forcing the generic marker+list UI onto a chart kind it
  wasn't built for; the underlying fact is already visible per-conference
  via each `BarRow`'s own hover detail, so this mainly demonstrates the
  registry wiring itself.
- **FIG606** (`custom`, 2025, "41% expired unused") — the same real
  `Certified-expired`/`Certified (Current + Expired)` computation already
  surfaced on the Overview's immigration-gates scrollytelling step
  (`scrollyData.ts`), now also expressed as a chart annotation directly
  on FIG606's own panel. Priority 2 (hidden by default, per the "default
  views show only high-priority annotations" rule) since it's a secondary
  fact, not the panel's own headline finding.

**A 6th candidate considered and deliberately deferred, not rushed in**:
FIG101's real per-year estimate/confirmed flags (1900-1901, 1916, 1923 —
already a `dataNote`, see the Methodology drawer section) would need 3
separate non-contiguous annotation entries to represent correctly rather
than one clean point/range, and FIG601-vs-FIG602's population mismatch is
a mismatch BETWEEN two separate exhibits, not a break within one
continuous series — neither fits the schema as cleanly as the 5 shipped
here. Flagged for a future pass rather than forced in for a rounder
number.

**Accessibility, by construction, not an afterthought**: the Nivo
`markers` prop (`ResponsiveLine`) renders a real but purely decorative
SVG line+label — it has no DOM focus target at all. The REAL interface is
a plain, always-rendered `<ul>` of real `<button>`s below the chart
(`.chart-annotation-list`), reachable by Tab regardless of the marker's
on-chart position, expanding the annotation's full `detail` text on
Enter/click — verified with a real Playwright keyboard test
(`tests/interaction.spec.ts`), not assumed from the markup alone.
Priority filtering (`showByDefault`) keeps the default view uncluttered,
with an "Annotations (N)" toggle to reveal the rest — same UI pattern
`SeriesChart`'s own >6-series picker already established. No new
animation exists to gate under `prefers-reduced-motion` — showing/hiding
the detail text is instant, not a transition.

**Real validation, not a formality** — `validateAnnotations()` checks
every registry entry's exhibit id and start/end year against the actual
imported `talent.json`, the same discipline the importer itself already
applies to real data (unknown ids, out-of-range values). Confirmed by
hand: `buildAnnotations()` run against the real production data produces
exactly the 5 expected entries with zero validation errors.

## Internal component gallery (2026-07-30)

Closes #14, the first of six features deliberately deferred when the
methodology/downloads/overview backlog (#2) closed — see `docs/
CLAUDE_CODE_SIX_DEFERRED_FEATURES.md` for the full locked scope of all
six, and issue #13 for the tracking issue. `src/pages/dev/components.astro`
+ `src/dashboards/ComponentGallery.tsx` + `src/dev/fixtures/
galleryExhibits.ts`.

**Real components, real (but small, local) data — never a mocked visual
replica.** Every chart example on the page is a real `ExhibitPanel`
rendering one of 10 small fixture `Exhibit` objects (`src/dev/fixtures/
galleryExhibits.ts`) through the exact same `ExhibitChart` dispatch every
real Track page uses — including its own real `MethodologyDrawer`,
citation, and CSV/JSON/SVG download buttons. Fixtures cover one example
per real `ChartKind` (timeseries, share-timeseries, leaderboard-years,
ranked-bar, country-map in both count and range mode), plus a >6-series
picker trigger, a real missing (`null`) data point, a deliberately long
title/citation, and a derived-exhibit `MethodologyDrawer` row. `Sankey`
isn't dispatched through `ExhibitChart` (real Track pages call it
directly via `sankeyData.ts`), so it gets its own tiny fixture
nodes/links object.

**A real bug the fixtures themselves caught**: the first leaderboard-years
fixture used a "long" shape (one row per year+entity pair, a `Year`
column) — `toLeaderboardYears()`'s real implementation expects the
actual report data's "wide" shape instead (one row per entity, a column
PER YEAR). The fixture silently rendered "No data for this exhibit"
until this was caught by hand and fixed to match the real shape FIG302's
own CSV export uses.

**Gated on a real `PUBLIC_ENABLE_DEV_GALLERY` env flag, not
`import.meta.env.DEV`** — a deliberate deviation from the scope doc's
own stated preference, made for a concrete, checked reason: this repo's
entire Playwright test harness (`playwright.config.ts`) drives `astro
preview`, a production-mode server where `import.meta.env.DEV` is always
`false`, same as a real deploy. A `DEV`-gated route's real content could
never be tested by that harness at all. An env flag lets a dedicated
build set `PUBLIC_ENABLE_DEV_GALLERY=true` and get real, checkable
content through the exact same `astro build` + `astro preview` pipeline
every other test already uses. A normal production build
(`build-and-deploy.yml` never sets this var) renders a plain "not
available" notice instead — confirmed by hand: `grep`ing the built
`dist/dev/components/index.html` for real gallery markup after an
unflagged build returns zero matches. Not in `DashboardNav.astro`'s own
`STAGES`/`REFERENCE` lists and not in any sitemap (this repo has no
sitemap generator) either way, so it's unreachable from real navigation
regardless of the flag.

**A second Playwright config, not a second test framework** —
`playwright.gallery.config.ts` (`testDir: "./tests/gallery"`) rebuilds
with the flag on via its own `webServer.command`, since the route only
has real content in that build state; `playwright.config.ts` gained a
matching `testIgnore: ["gallery/**"]` so its own recursive `./tests`
scan doesn't also try to run those specs against the wrong (flag-off)
server. `tests/gallery-hidden.spec.ts` stays in the main `tests/`
directory (it deliberately checks the flag-OFF, production-mode
behavior) and gets its own `npm run test:gallery-hidden` script,
matching the one-script-per-spec-file convention already established
for `test:a11y`/`test:interaction`/`test:visual`; `npm run test:gallery`
runs the flag-on suite (content renders, no third-party fetches, a real
methodology drawer example is keyboard-operable, plus 3-viewport visual
regression at 1440×1000/1024×768/390×844 — same real, Linux-baseline-
bootstrapped pattern as `tests/visual-regression.spec.ts`, and
`visual-baseline.yml` was extended with a second `--update-snapshots`
run against `playwright.gallery.config.ts` to regenerate both suites'
baselines in one manual dispatch going forward).

**CI sequencing — a real ordering hazard, caught before it shipped, not
after**: the gallery's own flag-on test step rebuilds `dist/` as a side
effect of its `webServer.command`, which would leave `dist/` built WITH
`PUBLIC_ENABLE_DEV_GALLERY=true` for every step after it — including the
final `actions/upload-pages-artifact@v3` that ships to production. A
"Rebuild for production (gallery flag off)" step runs immediately after
the gallery test step, restoring the real flag-off `dist/` before
`scripts/generate-downloads.ts` or the deploy artifact ever run. Without
this, the internal dev-only gallery's real content would have shipped to
the live site the first time this workflow ran on a push to `main`.

Not yet exhaustive — this is a real, useful v1 covering the major shared
components (buttons/chips/pills, `KpiCard`, all 5 `ChartKind`s,
`MethodologyDrawer`, download buttons, empty/disabled/focus states), not
a complete tick-through of every control this app owns (no combobox,
range control, or mobile filter sheet exist in this app at all yet, so
none are faked into the gallery). Grow it the same way every other
"Known gaps" item in this file grows: file by file, as a new shared
component gets built or a real gap is found.

## Interaction, accessibility, and visual-regression tests (2026-07-30)

Closes #9, the last tracked item in the methodology/downloads/overview
backlog (#2). `tests/accessibility.spec.ts`'s axe-core sweep already
covered `/methodology/`, `/downloads/`, and the rebuilt Overview (added
alongside #5/#6/#7, not new here) — but axe-core only flags markup
patterns (missing labels, contrast, landmarks). It can't tell you whether
a control actually operates correctly via keyboard, or whether a download
button produces a real file. Two new, real test files close that gap.

**`tests/interaction.spec.ts`** — three real checks: the methodology
drawer opens/closes via a focused `<summary>` and Enter, with no focus
trap (native `<details>` needs zero bespoke script for this, confirmed
rather than assumed); the download menu's CSV/JSON/SVG buttons produce
real files (`page.waitForEvent("download")`, then the actual file content
is read off disk and checked — a CSV has a header row and commas, a JSON
parses to a real `rows` array, an SVG file contains `<svg`); and real Tab
order reaches a control inside the Overview's last scrollytelling step.

**A real, severe bug, caught by the third check, not a hypothetical
one**: pressing Tab from the very top of any page got a keyboard user
stuck cycling inside the news ticker forever — `document.activeElement`
never advanced past `NewsTicker.tsx`'s own auto-scrolling story links,
confirmed by hand with a raw Tab-press loop logging the focused element
every step (200+ presses, same 3-element cycle every time, `<body>` in
between). Root cause: `.ticker-track`'s story links are positioned by a
continuously running CSS `transform` animation, and Chromium's real
sequential-focus-navigation silently fails to land on a
transform-positioned anchor while that animation is actively running,
dropping focus to `<body>` instead — meaning no keyboard user could ever
reach the nav, the KPIs, or a single chart panel while the ticker
auto-played, on any page, the entire time this feature has existed.
Fixed in `NewsTicker.tsx` by making each story link a real Tab stop
(`tabIndex={0}`) only once the ticker is actually paused, and
`tabIndex={-1}` while it's auto-scrolling — Tab now skips straight over
the ticker to real page content during autoplay, and the links become
reachable the moment a reader pauses it, when their position is
genuinely static. The second, always-duplicated copy of the story list
(existing purely so the CSS animation can loop seamlessly) is now also
`aria-hidden` and permanently untabbable, since a screen reader reading
linearly shouldn't hear every real story twice — a related, smaller real
issue noticed while fixing the first one, not scope creep.

**`tests/visual-regression.spec.ts`** — a small, deliberately scoped set
of pixel-diff snapshots: one representative panel per real `ChartKind`
this app renders (a `SeriesChart` timeseries, a `WorldMap`, a
`LeaderboardYears`, a `BarRow` ranked list, a `Sankey`), plus the
Overview's hero headline and KPI row — not one screenshot per exhibit
(91 real exhibits would make this slow and, per this issue's own tracked
concern, a much larger flakiness surface for no real added coverage).
`test.use({ contextOptions: { reducedMotion: "reduce" } })` removes
`useCountUp`'s KPI animation and the Sankey's particle motion (both
already gated on the same real `usePrefersReducedMotion` hook — no new
gating needed), and Nivo's own `animate={false}` (already set) removes
its mount animation — so every snapshot is deterministic on repeat runs
of the same OS.

**Baselines are real, generated on ubuntu-latest, never captured from a
contributor's own machine** — Playwright screenshots differ by real
pixels of anti-aliasing across macOS vs. Linux even with an identical
Chromium build, and this repo's actual CI (`build-and-deploy.yml`) runs
on `ubuntu-latest`. Playwright's own default snapshot naming
(`{name}-{platform}.png`) already keeps a `-darwin.png` local run and a
`-linux.png` CI run from ever cross-comparing, so this needed no custom
`snapshotPathTemplate`. The 7 committed `tests/visual-regression.spec.ts-
snapshots/*-linux.png` files were bootstrapped for real: a manual
`gh workflow run build-and-deploy.yml --ref <branch>` dispatch ran the
new visual-regression step on the actual ubuntu-latest runner, its
"missing baseline, writing actual" output was captured via a new
`actions/upload-artifact` step (added specifically for this, gated on
the visual-regression step's own `outcome` rather than the job-level
`failure()`, since `continue-on-error: true` masks the latter), the 7
real PNGs were downloaded and checked by hand (real chart content, no
artifacts, particles correctly suppressed on the Sankey), then committed
— and a second dispatch confirmed the comparison genuinely passes clean
against them (`5 passed`), not just that a baseline exists.

A dedicated **`visual-baseline.yml`** workflow (`workflow_dispatch`-only)
exists for regenerating these going forward without needing the
bootstrap detour above — but GitHub only lets `workflow_dispatch` target
a workflow file that already exists on the repo's *default* branch, so
it can't actually be dispatched yet from a feature branch. It'll work
once these changes reach `main` through the normal PR chain; until then,
the bootstrap method above (a manual dispatch of the already-registered
`build-and-deploy.yml`, downloading its on-`outcome`-failure artifact) is
the real fallback, not a placeholder.

The visual-regression CI step runs with `continue-on-error: true`
**permanently, not as a bootstrapping shortcut** — a real diff (or
baseline drift from ubuntu-latest's own font packages updating between
separate runs, months apart) is a visible signal worth a human look, not
a hard gate that should block an unrelated deploy, given the real,
acknowledged cross-machine flakiness `toHaveScreenshot()` carries even
within one OS over time.

**A real, unrelated CI bug surfaced and fixed while validating all of
this**: the first manual dispatch of `build-and-deploy.yml` on
`ubuntu-latest` failed outright at the `Build` step — "Node.js v20.20.2
is not supported by Astro! ... upgrade Node.js to a supported version:
>=22.12.0." Every local build this session had succeeded only because
the local Node version (25.x) already cleared that bar; nothing had
actually exercised this exact path in CI since Astro's own `engines`
field tightened past 20, some while after `build-and-deploy.yml`'s
`node-version: 20` was originally set. Fixed by bumping both workflows'
`setup-node` to 22 and adding a real `engines` field to `package.json` so
the mismatch surfaces at `npm install` time too, not buried inside a
build failure — a real, previously-latent breakage in the shared CI
pipeline, not something introduced by this session's own changes, caught
only because this issue's own verification step actually ran the real
pipeline instead of trusting the new steps would work by inspection.

## Overview scrollytelling (2026-07-30)

Closes #7. `Overview.tsx` no longer opens with 6 equal KPI cards and a
flat "Two Streams" panel — it now leads with 4 real headline numbers
(down from 6, per the redesign brief's own "no more than four headline
statistics above the first scroll"), then a real 6-step guided sequence
(`src/components/Scrollytelling.tsx`), then the existing "What's
happening at each stage" stage-entry-point section, now also linking to
`/downloads/` for the user's own "view all the RAW data, not our
processed files" direction.

**The core visual mechanic is plain CSS, not JavaScript** — each
section's own visual gets `position: sticky` (scoped per-section, not a
global scroll listener), so it stays pinned while that section's own
text scrolls past, then releases to the next section's own sticky visual
once its text runs out. This is a deliberate choice, not a shortcut:
native CSS sticky needs zero script to work, so there's no separate
"what does this look like with JS off" version to maintain for the core
effect — a no-JS reader gets the exact same sticky-then-release behavior
a JS reader does. Below 900px, sticky positioning is disabled entirely
and each step's visual renders inline right after its own text — the
same plain linear reading order the no-JS fallback uses on any screen
size, not a separately-maintained "mobile mode."

Each step gets a real `<h2>` — already-native keyboard/screen-reader
heading navigation, not a bespoke widget invented for a need HTML
already meets. The one real JavaScript enhancement layered on top: a
lightweight `IntersectionObserver` that updates `?step=<id>` via
`replaceState` as each step's heading crosses the viewport center — the
same replaceState-only, no-history-spam pattern already used for pinned
countries and theme. Verified by hand: scrolling to the last step
updates the URL to `?step=research-leadership` with no extra history
entries.

**Six real steps, six real data sources — nothing fabricated**:
1. Two streams — reuses the existing `twoStreamsSankey`/`Sankey`
   directly, no new code.
2. Degree production by level — a new `DegreeLevelExplorer.tsx` combines
   FIG108's real time series (the same data step 1's Sankey already
   uses) with TAB101's real field-level bookend comparison (first real
   year vs. most recent real year — TAB101 has no full per-field time
   series, so the field view is honestly a real snapshot pair, not a
   fabricated trend line between them).
3. The domestic pipeline — a new `PipelineFunnel.tsx` reads TAB401's own
   real STEM-entrant cohort outcomes, distinguishing "left STEM but
   stayed in college" from "left college entirely" using that exhibit's
   own real columns, not an inferred split.
4. Immigration gates — a new `ImmigrationGates.tsx` shows one real,
   hand-confirmed fact per gate from 4 different real exhibits (FIG603's
   STEM OPT approval rate, FIG303's H-1B concentration, FIG606's real
   41% PERM-certification-expiration rate, TAB605's real ~149-year
   India EB-2 wait) — deliberately NOT a Sankey implying one real cohort
   tracked through all five gates in sequence, since no such dataset
   exists; five real, separately-sourced facts about five different
   real populations and years, stated as such.
5. The retention gap — reuses the existing `retentionFunnelSankey`/
   `Sankey` directly, no new code, including its own existing
   population-mismatch caveat.
6. Research leadership — a new `ResearchMetricSwitcher.tsx`, one real
   US-vs-China measure at a time (conferences/FIG501, publications/
   FIG502, patents/TAB506, R&D intensity/FIG509) — never combined into
   an invented composite score, since a share and a raw patent count
   don't share a unit. TAB506 (a company-level exhibit) is aggregated to
   real country totals for this one comparison, the same real 2025
   figures already shown on the Research Output stage page.

New `src/lib/scrollyData.ts` holds all the real data-prep for steps 2-4
and 6 (steps 1 and 5 reuse `sankeyData.ts` unchanged) — every function
tested against both synthetic fixtures and, by hand, the real imported
data before any UI was built on top of it.

**A real layout bug caught by screenshot, not shipped blind**:
`PipelineFunnel`'s own real labels ("Finished with a STEM bachelor's")
are full descriptive phrases, not the short country/company names every
other real `.barrow` caller uses — the shared component's default 108px
name column truncated them into unreadable "Finished with a ST…"
fragments, confirmed in an actual screenshot before this was caught.
Fixed with a new `.barrow-wide` modifier (a wider name column, real text
wrapping) used only by `PipelineFunnel`, not a global change to every
other real `.barrow` caller's already-correct short-label layout.

Verified: zero axe-core violations (added to the committed suite would
be redundant — `/` was already covered), all 87 unit tests passing,
real interaction confirmed by hand with Playwright (the field selector
swaps to real per-field bars, the metric switcher swaps to real
per-metric bars, the URL updates on scroll), and the no-JS fallback
confirmed separately — with JavaScript disabled, all 6 real `<h2>`
headings, 3 real chart `<svg>`s (the 2 Sankeys plus step 2's Nivo line
chart), and all 4 real immigration-gate facts are present in the raw
HTML, not injected by script.

## The /downloads/ route (2026-07-30)

Closes #6. `src/pages/downloads.astro` + `src/dashboards/Downloads.tsx` —
search, a stage-chip filter, combined bundles, and every real exhibit in
one table, each with its own real raw/CSV/JSON/PNG links.

**The real distinction the user asked for explicitly**: "raw" and
"processed" are two different real things here, never conflated. A new
`src/lib/rawSourceFiles.ts` (`resolveRawSourceFiles()`) resolves each
exhibit back to the literal, unmodified CSV(s) it was imported from in
`talent_charts/data/` — mirroring the importer's own real logic exactly
(a derived exhibit's `derivedFrom` names its real source; a split-mode
multi-part exhibit's hyphenated id, e.g. `TAB202-a`, maps to its real
unhyphenated raw filename, `TAB202a.csv`; a merge-mode exhibit resolves
to every real part file folded into it), not guessed at separately.
Verified against real data, not assumed: every one of the 91 real
exhibits' resolved raw file(s) actually exist on disk (0 missing), and a
byte-for-byte diff confirms the copied `dist/downloads/raw/*.csv` files
are identical to their real source. The "Processed CSV/JSON" buttons sit
right next to the raw link on the same row, generated the exact same
client-side way `MethodologyDrawer.tsx`'s own buttons already do (reused
directly, not reimplemented) — so the difference between the two is
visible on the same line, not buried in separate places.

**`scripts/generate-downloads.ts` grew three more real, build-time
outputs**, alongside the PNG/ZIP pipeline from #4:
- Raw source files, copied (not regenerated) into `dist/downloads/raw/`,
  deduplicated by real filename — several derived exhibits share one
  real source (everything derived from FIG302 resolves to the same
  `FIG302.csv`), copied once, not once per exhibit.
- One combined `all.zip` spanning every real exhibit (91 small CSVs,
  ~110KB total — genuinely small, not a build-size concern, confirmed by
  hand rather than assumed).
- `metadata.csv`, a real data dictionary (exhibit id, title, stage,
  source, resolved raw files, derivation) generated from the same real
  fields everything else in this pipeline already uses.

**A real, second-order bug this predicate work caught, not shipped
blind**: predicting which exhibits get a PNG at Astro build time (before
the LATER screenshot pass that actually knows) needs its own logic,
`src/lib/chartAvailability.ts`. A first version wrongly counted
`BoxPlotRow` (FIG512/FIG513) as SVG-producing — checked directly against
that component's real source and found it's plain absolutely-positioned
HTML/CSS divs, the same real pattern `BarRow.tsx` uses, not an `<svg>`
at all. Caught by diffing the predicate's own output against
`generate-downloads.ts`'s REAL generated PNG file list (66 predicted vs.
62 actually generated, not assumed to match), which also surfaced a
second, different real case: FIG601/FIG602 never render as their own
standalone panel anywhere (`TrackRetentionImmigration.tsx`'s own
`excludeIds` — their data feeds that stage's hero Sankey directly), so
the real screenshot pass never encounters them regardless of chart kind.
Both are now explicit, tested cases in the predicate, not silently
wrong — re-verified afterward: 62 predicted, 0 mismatches against the
real file list.

**A real CSS specificity bug caught by hand, not left in**: `.lb thead
th`'s own `padding: 0 0 5px` (zero right-padding) beat a same-specificity
`.crosswalk-table th`/`.downloads-table th` override, so both new
tables' header text ran together edge to edge ("DATE RANGEDOWNLOAD") —
confirmed visually, not assumed fixed just because the CSS rule existed.
Fixed by matching `.lb thead th`'s own specificity (`.crosswalk-table
thead th`, not a bare `.crosswalk-table th`), verified by re-screenshotting
both tables' real headers after the fix.

Extracted `PARTS` (the multi-part-exhibit merge/split spec) out of
`scripts/import-talent-charts.ts` into a shared `src/lib/exhibitParts.ts`
— pure data, no fs/DOM dependency, reused by `rawSourceFiles.ts` the same
way `parseCsv`/`csv`/`dateRange` were already extracted for the
methodology and download work. Confirmed the importer's own output is
byte-identical before and after (besides the real `generatedAt`
timestamp) — a pure refactor, not a behavior change.

Verified: zero axe-core violations on the new route (added to the
committed suite), all 77 unit tests passing, every real download link
(raw file, CSV button, combined ZIP, metadata dictionary) fetched and
confirmed working by hand with Playwright, not just rendered.

## The /methodology/ route (2026-07-30)

Closes #5. `src/pages/methodology.astro` + `src/dashboards/Methodology.tsx`
— a real, full methodology reference, added as the 8th nav entry
(`DashboardNav.astro`'s new `REFERENCE` row, separate from the 6-stage
`Track` row so that one still reads as exactly the pipeline it always
was) alongside a new `/downloads/` entry (route not yet built — see #6).

Twelve real sections, every one backed by actual data or actual code,
never invented copy:

- **Definitions** — foreign-born, noncitizen, temporary visa holder,
  international student, and 6 more. Framed explicitly as general
  definitions from the federal data sources this site draws on (NCES,
  NCSES, USCIS, DOL, State, IIE), NOT a claimed quotation of the report's
  own manuscript — `writing/*.docx` is deliberately gitignored,
  unpublished draft content this app has no access to, so claiming to
  quote its exact wording would be an unverifiable claim.
- **Data-source catalog** — `src/lib/dataSourceCatalog.ts`, a real,
  tested function grouping every exhibit's own `sourceShort` by citing
  organization (19 real organizations across 91 exhibits) — generated
  from the same data every chart already cites, not a hand-authored
  second copy that could drift out of sync. Caught and fixed a real,
  confirmed source-data inconsistency in the process: USCIS's own H-1B
  Employer Data Hub citation appears both with and without a trailing
  period across two different exhibits — normalized at read time (talent_
  charts/titles_and_sources.csv itself stays untouched as real committed
  source data). Also handles a real edge case a naive comma-split would
  break on: one citation ("IPO Association (2005, 2015), Harrity...")
  has a comma inside parentheses before its real delimiter — the
  extractor tracks paren depth and only splits at a real top-level comma.
- **Calculation methods** — every exhibit with a real `derivedFrom` (the
  6 exhibits from the methodology-drawer work above), rendered directly
  from data already on each `Exhibit`, not re-authored.
- **Employer-name normalization / corporate-parent aggregation** — the
  real content from `entityResolution.ts`'s own section above, now
  actually documented on a public page instead of just in code comments.
- **Missing-data conventions** — the real, already-established importer
  practices (Grand Total row dropping, blank-column dropping, thousands-
  comma coercion), plus every exhibit's own real `dataNote` (FIG101's
  estimate/confirmed year mix, FIG601 vs. FIG602's different populations).
- **Projection methods** — a real, newly-confirmed finding: FIG109/FIG110
  (international doctorate-production comparisons) each store the
  report's own author-generated projections in a separate "(Country)
  (projected)" column per country, kept apart from observed values. Every
  other exhibit is an observed historical statistic, not a forecast —
  stated plainly rather than left ambiguous.
- **Geographic and country definitions**, **known source/methodology
  breaks** — real, already-established facts from `countries.ts` and
  `docs/report-crosswalk-notes.md`, consolidated onto one public page
  instead of scattered across code comments and internal docs.
- **Report-to-web crosswalk** — rendered directly from `content/report-
  crosswalk.csv` via a new `src/lib/loadCrosswalk.ts` (same
  `process.cwd()`-based build-time read pattern as `loadTalentData.ts`),
  not a hand-authored second copy — all 163 real report items, including
  the 77 archived-and-excluded ones, each with a real, stable
  `#crosswalk-<report_id>` anchor.
- **Revision history** — the real `generatedAt` import timestamp; full
  dated history stays in `CLAUDE.md` itself rather than a second,
  competing changelog.
- **Search** — one real client-side text filter (this app's first — no
  prior search UI existed anywhere to reuse) across both the definitions
  list and the crosswalk table, since those are the two genuinely
  list-shaped sections; the other ten sections are each a handful of
  prose blocks that don't need filtering.

**Real per-exhibit deep link, closing the "methodology link should open
the relevant section" requirement**: `MethodologyDrawer.tsx` now has a
real "Full methodology for `<id>` →" link to `/methodology/#crosswalk-
<exhibit.id>`, landing directly on that exhibit's own crosswalk row
(`.crosswalk-table tbody tr:target` highlights it), not just the top of
the page. Verified by hand with Playwright: clicking the link from a real
exhibit's drawer navigates to the exact right anchor and the target row
genuinely exists.

Extracted `parseCsv` out of `scripts/import-talent-charts.ts` into a
shared `src/lib/parseCsv.ts` (pure string parsing, no fs/DOM dependency)
so `loadCrosswalk.ts` uses the exact same real RFC4180 parser instead of
a second, potentially-inconsistent implementation — the importer's own
behavior is unchanged, just reading from one shared place now.

Verified: zero axe-core violations on the new route (same suite as every
other page), all 69 unit tests passing, real search filtering confirmed
against the live page, no console errors beyond the same pre-existing
unrelated news-ticker CORS noise every other page already has.

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
