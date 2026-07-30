# Global Talent Monitor

A pipeline view of US STEM talent, from K-12 foundation through degree
production, graduate/postdoctoral training, workforce entry, retention and
immigration, and research output. Six real stages (`src/lib/types.ts`'s
`STAGES`), each backed by real, cited exhibits imported from `talent_charts/`
— the R project behind "The Great Talent Competition," a report drawing on
~25 primary sources (NCES, NCSES/NSF, USCIS, DOL, the State Department, IIE,
OECD, UNESCO, OpenAlex, Clarivate, the Nobel Foundation/ACM, Times Higher
Education, WIPO, USPTO PatentsView).

1. **Foundation** — K-12 outcomes (PISA), school spending, early persistence.
2. **Degree Production** — completions, STEM share, doctorates overview.
3. **Graduate & Postdoctoral Training** — grad enrollment, postdocs,
   international students by level/field.
4. **Workforce Entry** — who works in STEM, H-1B employers, AI-company
   founders.
5. **Retention & Immigration** — stay rates, OPT, H-1B volume/denials, PERM,
   green-card wait times.
6. **Research Output & Competitiveness** — citations, prizes, rankings, R&D
   spend, patents.

Every exhibit renders as its own panel: a real chart (picked from its data's
real shape — a time series, a world map, an entity×year leaderboard, or a
ranked bar list), a hover tooltip with the real underlying number, and an
expandable citation that traces straight back to the report's own source and
URL. There's no fabricated summary number anywhere — the Overview's KPI row
and every stage's analyst note read a real value off a real exhibit.

The design is a tightened instrument, not a dashboard template: one border
radius, borders instead of shadows, Hoover Red spent on exactly one accent,
and country colors that encode real data (named-actor identity for
US/China/India/the EU bloc, one neutral for everyone else). Rules are in
`CLAUDE.md`'s design-system section.

## No live source, no key needed

Every source behind this data updates on an annual/biennial cycle at
fastest, and the CSVs in `talent_charts/data/` are already that report's
finished, cited output — there's nothing to fetch live or poll on a
schedule. `public/data/talent.json` is a normal committed file; a fresh
clone works immediately with no setup.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173 — reads the already-committed public/data/talent.json
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

## Refresh the data

Only needed when `talent_charts/` itself gets a fresh export from the
report's authors:

```bash
npm run import-talent-charts   # reads talent_charts/, writes public/data/talent.json
```

Check the console output — it prints real per-stage exhibit counts and
which exhibit ids were skipped (either no standalone CSV, or computed
inline in the report's own R pipeline from another table). See
`CLAUDE.md`'s "Where the data comes from" section for what the importer
handles (multi-part exhibits, a derived statistic, a pivot export's
"Grand Total" footer row, a malformed source cell) and "Known gaps" for
what's deliberately not yet ported.

## Deploy to GitHub Pages

1. Push to a GitHub repo, branch `main`.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub
   Actions**.
3. The workflow (`.github/workflows/build-and-deploy.yml`) builds and
   deploys on every push to `main` — no schedule trigger, since there's no
   live source to refresh. The base path is set to the repo name
   automatically; for a custom domain or user site, set `GTM_BASE=/` in the
   workflow.

## Extend it

- **New analyst notes** — `data/talent/notes.ts`, one `StageNote` per stage.
- **A new pipeline stage** — add it to `STAGES`/`Stage` in
  `src/lib/types.ts`, a chapter mapping in
  `scripts/import-talent-charts.ts`, and a new `Track*.tsx` using the shared
  `TrackShell` component. See `CLAUDE.md` before forcing new data into an
  existing stage that doesn't really fit it.
- **A recurring bad chart** — fix the general classification/rendering
  logic (`inferKind` in the importer, or the mode-detection heuristics in
  `src/components/ExhibitChart.tsx`), not a one-off special case for a
  single exhibit's id.

## Files

```
talent_charts/                     the report's own R project — titles_and_sources.csv + data/*.csv, the real source of every number here
scripts/import-talent-charts.ts    reads talent_charts/, writes public/data/talent.json (committed, not fetched on a schedule)
data/talent/notes.ts               analyst "so what" notes — edit by hand
src/lib/types.ts                   the data contract — Stage, ChartKind, Exhibit, DataFile
src/lib/exhibitData.ts             generic extraction helpers (Exhibit -> chart-ready shapes)
src/components/ExhibitChart.tsx    dispatches an Exhibit to the right chart component by its real data shape
src/components/ExhibitPanel.tsx    one exhibit, one panel: title + chart + citation
src/dashboards/                    Overview + 6 Track pages, one per stage
src/App.tsx                        single data fetch, dashboard tab state
src/styles/index.css               design tokens — one radius, borders not shadows, Hoover Red as the one accent
```

See `CLAUDE.md` for the full architecture, what didn't survive this
rebuild (an earlier "Global Tech Monitor" version tracking quantum
computing and AI), and known gaps.

Hoover Red (#98002E) is the one color carried over from the Hoover
Institution brand guide; everything else is its own tightened instrument.
Not an official Hoover product.
