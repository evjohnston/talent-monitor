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
- **Six exhibits are computed inline** in the report's own R pipeline from
  other tables, with no standalone CSV to read at all (`SKIP_COMPUTED`:
  `TAB303`, `FIG405`, `TAB503`, `TAB504`, `TAB603`, `TAB605`) — skipped and
  logged by the importer rather than reverse-engineered or faked. Real
  follow-up work, not a silent gap: the console output on every run prints
  exactly which ids were skipped and why.

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
  a label doesn't read "colt · colt".

`ExhibitPanel.tsx` is the one building block every Track page uses: real
title, real chart, real citation footer — never optional, since every
number here traces to a specific cited source.

## Dashboards: Overview + 6 Tracks

`src/dashboards/` keeps the old app's "Track" pattern (one file per stage,
`DashboardContext`, `DashboardNavigation` tabs) — just repointed at the new
stage set. `TrackShell.tsx` is the shared shape all 6 `Track*.tsx` files use:
the stage's latest analyst note as a takeaway, one full-width "hero" exhibit
(the one the note is grounded in), then every other real exhibit for that
stage as its own panel, three to a row. **Every exhibit for a stage renders
somewhere** — no top-N cut of the real data; a stage with 20 exhibits gets
20 panels, not a curated 6.

`Overview.tsx`'s KPI row is six real numbers, one per stage, each read off
that stage's own hero exhibit via `toLatestValue`/`toRankedBars` — never a
fabricated summary/index number.

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
`countries.ts`, `continentMap.ts`, `format.ts`, `csvExport.ts`,
`chartLabels.ts`, `useReducedMotion.ts`, `DashboardNavigation` (now 6 stage
tabs + Overview, driven by `STAGES` instead of a hardcoded 4-item array).
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

## Known gaps

- **Six exhibits not yet ported** (`TAB303`, `FIG405`, `TAB503`, `TAB504`,
  `TAB603`, `TAB605`) — computed inline in the report's own R pipeline from
  other tables, not a standalone CSV; logged by the importer every run
  (`SKIP_COMPUTED` in `scripts/import-talent-charts.ts`). Real follow-up:
  trace each one's real R computation and port it, don't guess at a number.
- **The 77 archived (`AF`/`AT`-prefixed) exhibits** are real data, cut from
  the report's final version — not imported, not rendered anywhere. Worth
  revisiting if a future "extended data" section is wanted; the importer
  already skips them cleanly (`finalIds` filter) rather than needing new
  code to add them later.
- **The generic `ranked-bar` fallback** is a deliberate, disclosed
  trade-off for exhibits that don't cleanly fit the other four `ChartKind`s
  (e.g. FIG512/513's distribution-stats tables, FIG404's country+group+5-
  metric snapshot) — it picks a reasonable default (last real-numeric
  column, composite label) rather than a bespoke chart per exhibit. Fine
  for now; a future pass could add more `ChartKind`s if a shape recurs
  often enough to be worth a dedicated renderer.
- **No country-compare or CSV-export UI yet** — both real, useful, and
  present in the old app in some form, but cut from this rebuild's v1 scope
  deliberately rather than ported speculatively before the new model was
  proven. `csvExport.ts`'s `downloadCsv()` still exists and works if this
  gets picked back up.
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
  stage, newest shown.
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
```

On a fresh clone, `public/data/talent.json` is already committed — `npm run
dev` works immediately with no fetch/import step needed. Only re-run
`import-talent-charts` after `talent_charts/` itself changes.
