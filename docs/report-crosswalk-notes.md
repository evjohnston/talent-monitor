# Report crosswalk — Phase 1.3 notes

Companion to `content/report-crosswalk.csv` (Phase 1.1/1.2 — all 163 real
report items classified, none unclassified). This covers Phase 1.3's
remaining asks: shared adapters, undocumented calculations, and
inconsistent labels/units found while building the crosswalk.

## Repeated-dataset groups (one adapter/explorer should replace several panels)

Counts below are `integrated_into_other_visual` rows per stage — i.e. real
exhibits that should feed an existing `stage_hero`/`supporting_visual`
explorer rather than render as their own panel. 34 of the crosswalk's 163
rows fall into this bucket.

- **Foundation** (7): FIG403/406/407/TAB402/FIG411/TAB403/TAB404 — the
  completion-path module (FIG406+TAB401+FIG407+TAB402) is the biggest win:
  4 real exhibits, one explorer, one cohort toggle.
- **Degree Production** (5): FIG103/104/105/106/110 — FIG102-105 share one
  IPEDS-completions adapter (same source, same year range, only the
  degree-level/field cut differs); genuinely one dataset read four ways
  today.
- **Graduate & Postdoctoral Training** (8): FIG204/206/208/TAB203/TAB204 +
  3 more — TAB202's three real parts (Engineering / Math & CS / Physical &
  Life Sciences) are the exact columns of one heatmap, not three line
  charts; same for TAB203's three parts feeding the postdoc-composition
  module.
- **Workforce Entry** (5): FIG303/TAB301/FIG304/FIG307 + 1 — FIG302+FIG303
  share one real adapter already (FIG303 is *computed from* FIG302's own
  data, see `scripts/import-talent-charts.ts`'s `buildFig303` — this
  dependency already exists in code, the UI just hasn't caught up to it).
- **Retention & Immigration** (2, smallest group — most of this stage's
  content is genuinely one-exhibit-one-module): FIG601, FIG605.
- **Research Output & Competitiveness** (8): FIG502/503/508/509/513 +
  TAB506 + 2 more — all real candidate feeds into the one metric-switcher
  hero (7.6's own described module).

**Net effect if built as designed**: 163 real report items compress to
roughly 6 hero explorers + ~25-30 supporting modules, not 163 (or even 86)
same-weight panels — the actual structural fix the redesign is for.

## Calculations in current code not documented in the report

- **FIG303** ("Are H-1B Approvals Still Concentrated Among a Few
  Employers?") — the report's own chapter computes this from FIG302's raw
  employer×year data inline in R (`figures.Rmd`'s `fig030_shares()`
  helper), never saved as its own CSV. This app's importer
  (`scripts/import-talent-charts.ts`'s `buildFig303`) replicates that exact
  computation (top-10-by-year share of total approvals) from FIG302's
  already-imported data. Real, correct, and disclosed in code comments —
  but not documented anywhere a reader of the *web app* would see it. The
  new methodology drawer should say explicitly "computed by this site from
  FIG302's own data, replicating the report's own method," not just cite
  FIG302's source as if FIG303 were independently sourced.
- **No other derived calculation exists in the current app.** Every other
  rendered number is a direct pass-through of a `talent_charts/data/*.csv`
  cell.

## Inconsistent labels, units, populations, years, denominators

- **FIG601 vs. FIG602 — different populations, same subject ("do
  international PhDs stay").** FIG601 is a near-graduation *intent* survey;
  FIG602 is an *observed-location* follow-up of an actual tracked cohort.
  The current Sankey hero already captions this distinction by hand
  (`TrackRetentionImmigration.tsx`) — the redesign must preserve that
  caption, not silently merge the two into one flow (see the task doc's
  own Phase 7.5 "Stay intentions versus observed stay" module, which
  requires the same warning).
- **FIG603 mixes counts and a rate on one chart today.** Columns are
  `Received`/`Approved`/`Denied` (raw counts, thousands) and `Approval
  Rate` (a 0-1 fraction) — currently plotted on one shared y-axis in
  `SeriesChart`, which the task doc's Phase 7.5 acceptance criteria
  explicitly forbids ("no mixed count/rate axis"). Real bug to fix in the
  redesign, not a style preference.
- **TAB604 ("How Many PERM Certifications Go Unused?") repeats "India" as
  every visible row label** in the current generic ranked-bar rendering —
  the real underlying data (`Country, Year, Status, Count, Share`) has
  year and status dimensions the current fallback chart drops entirely,
  so 10 different India/year/status rows all print as just "India." Not a
  labeling bug in the data — a real gap in the current generic chart
  picking only one dimension.
- **Country-name inconsistency across sources**: "South Korea" (FIG203),
  "Republic of Korea" (FIG410/TAB505), "Korea" (FIG608) all refer to the
  same country across different NCSES/OECD/UNESCO source tables. The
  current app's `codeFromCountryName()` already resolves all three to the
  same ISO code for coloring purposes (confirmed correct), but the
  **displayed label** still shows whichever raw string that source used —
  a reader comparing two charts could reasonably wonder if they're the
  same country. The redesign's shared adapter layer should normalize
  displayed labels too, not just the color-driving code.
- **"International student" is not one population across sources.** IIE's
  Open Doors series (FIG106/FIG107/etc.) counts *enrolled* students;
  NCSES's SED (FIG101/FIG105/etc.) counts *doctorate recipients* by
  citizenship; USCIS's SEVIS-adjacent OPT data (FIG603) counts *work-
  authorization applicants*, a downstream population, not enrollment. No
  current chart states which of these three it means at the point of use
  — this is exactly Phase 10.2's "preserve report distinctions" ask, not
  yet met anywhere in the app. The metric registry (Phase 1.4) is where
  each of these gets a real, distinct `population` field instead of a
  shared implicit assumption.

## Explicitly not repaired here

Per Phase 1.3's own instruction ("do not repair substantive inconsistencies
without author review"), none of the above were changed — they're flagged
in the crosswalk's `caveat`/`notes` columns for your review, and the
FIG601/FIG602 population distinction is already correctly handled in the
live app (verified, not just planned).
