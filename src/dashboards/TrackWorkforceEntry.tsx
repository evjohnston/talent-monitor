import type { DashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";

// Fifth stage rebuilt with TrackShell's `sections` prop. FIG302 (the raw
// H-1B employer×year leaderboard FIG303's own hero trend is computed FROM
// — see scripts/import-talent-charts.ts's buildFig303) opens the
// sequence right after the hero, since content/report-crosswalk.csv
// itself flags "FIG302+FIG303 share one real adapter already... the UI
// just hasn't caught up to it." TAB302 (visa concentration by
// occupation) joins it as the same "concentration" question from a
// different angle. FIG301/TAB301 are both literally "does a STEM degree
// lead to a STEM job" — the CSV's own read. FIG304-308 are every AI-
// company exhibit (founder origin, by year, by map, by company, by
// valuation, by research-staffing location) — one real cluster, not five
// unrelated ranked bars.
//
// Known, deliberately NOT changed here — same shape as Graduate &
// Postdoctoral Training's FIG201/FIG207 discrepancy (see CLAUDE.md's
// "Dashboards" section): the crosswalk designates FIG302, not FIG303, as
// this stage's stage_hero, with FIG303 meant to be merged INTO that hero
// rather than stand alone. Left as FIG303 here because this stage's
// analyst note is written about FIG303's own H-1B-concentration finding
// ("the top 10 H-1B employers took 78.2% of approvals...") — swapping the
// hero without rewriting that note would split the headline finding from
// the hero visual, the same reasoning as the other stage's discrepancy.
export function TrackWorkforceEntry({ ctx }: { ctx: DashboardContext }) {
  return (
    <TrackShell
      ctx={ctx}
      stage="workforce-entry"
      heroId="FIG303"
      sections={[
        {
          title: "Who actually works in STEM after training",
          ids: ["FIG301", "TAB301"],
        },
        {
          title: "The H-1B employer landscape, in more detail",
          ids: ["FIG302", "TAB302"],
        },
        {
          title: "AI-company founders and staffing",
          ids: ["FIG304", "FIG305", "FIG306", "FIG307", "FIG308"],
        },
      ]}
    />
  );
}
