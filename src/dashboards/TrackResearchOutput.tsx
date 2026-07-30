import type { TrackDashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";

// Sixth and final stage rebuilt with TrackShell's `sections` prop —
// completes the sections rebuild across all 6 stages (see CLAUDE.md's
// "Dashboards" section for the full list). Grouped per
// content/report-crosswalk.csv's own per-exhibit notes: FIG501-504 and
// TAB501 are every real "who leads in cited/frontier research" exhibit
// (including the AI-conference authorship shift specifically); FIG505-507
// and TAB502 are this stage's prestige signals (Nobel laureates,
// university rankings); FIG508-511 are every R&D-spending metric;
// FIG512/513 and TAB505's 3 real parts are research-impact and
// critical-technology patents, the CSV's own "company research impact"
// and "critical technology patents" modules.
//
// Known, deliberately NOT changed here — the largest of this session's
// hero/crosswalk discrepancies (see also Graduate & Postdoctoral
// Training's FIG201/FIG207 and Workforce Entry's FIG302/FIG303 notes in
// CLAUDE.md): the crosswalk designates FIG501 as this stage's stage_hero,
// envisioned as ONE metric-switcher explorer absorbing FIG502/503/506/
// 507/508/513/TAB506 entirely — not eight separate hero-weight panels.
// Left as TAB506 here, unbuilt as a real interactive metric-switcher,
// since this stage's analyst note is written about TAB506's own
// patent-leadership finding and building that switcher is real,
// substantially larger work than this pass's section-grouping — a
// genuine future Phase 4/7 undertaking, not a same-day fix.
export function TrackResearchOutput({ ctx }: { ctx: TrackDashboardContext }) {
  return (
    <TrackShell
      ctx={ctx}
      stage="research-output"
      heroId="TAB506"
      sections={[
        {
          title: "Who leads in cited and frontier research",
          ids: ["FIG501", "FIG502", "FIG503", "FIG504", "TAB501"],
        },
        {
          title: "Prizes, laureates, and academic prestige",
          ids: ["FIG505", "FIG506", "FIG507", "TAB502"],
        },
        {
          title: "R&D investment",
          ids: ["FIG508", "FIG509", "FIG510", "FIG511"],
        },
        {
          title: "Research impact and patents",
          ids: ["FIG512", "FIG513", "TAB505-a", "TAB505-b", "TAB505-c"],
        },
      ]}
    />
  );
}
