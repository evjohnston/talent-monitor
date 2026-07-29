import type { DashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";

// Fourth stage rebuilt with TrackShell's `sections` prop. Grouped per
// content/report-crosswalk.csv's own per-exhibit notes from Phase 1 —
// most explicitly, that CSV says outright "TAB203's 3 real parts feed the
// same module as FIG207/208, not 3 separate panels," which is exactly why
// FIG208 and TAB203's parts open the sequence right after the hero rather
// than sitting wherever their own exhibit `order` would otherwise place
// them. FIG206 and TAB201 (this stage's country-by-country exhibits) join
// FIG203/204 as "where they come from"; TAB202's 3 parts join FIG205 as
// "what they study" (the CSV's own "country x field concentration
// matrix" module); FIG209-212 are this stage's one real ranked-bar/
// outlook cluster, kept apart from the timeseries-heavy sections above
// per the CSV's FIG210 note ("keep grouped separately from admin time
// series").
//
// Known, deliberately NOT changed here: content/report-crosswalk.csv
// itself designates FIG201 (not FIG207) as this stage's stage_hero — a
// real discrepancy between that earlier planning pass and this stage's
// actual hero today. Left as FIG207 for this rebuild because the stage's
// analyst note in data/talent/notes.ts is written about FIG207's own
// postdoc-composition finding; swapping the hero without also rewriting
// that note's editorial content would leave the headline finding and the
// hero visual telling two different stories. Worth a real look in a
// future pass, not silently fixed here.
export function TrackGraduateTraining({ ctx }: { ctx: DashboardContext }) {
  return (
    <TrackShell
      ctx={ctx}
      stage="graduate-training"
      heroId="FIG207"
      sections={[
        {
          title: "Postdoctoral and graduate training composition",
          ids: ["FIG208", "TAB203-a", "TAB203-b", "TAB203-c"],
        },
        {
          title: "How many international students are here, and at what level",
          ids: ["FIG201", "FIG202", "TAB204"],
        },
        {
          title: "Where they come from",
          ids: ["FIG203", "FIG204", "FIG206", "TAB201"],
        },
        {
          title: "What they study",
          ids: ["FIG205", "TAB202-a", "TAB202-b", "TAB202-c"],
        },
        {
          title: "The economics and outlook of international enrollment",
          ids: ["FIG209", "FIG210", "FIG211", "FIG212"],
        },
      ]}
    />
  );
}
