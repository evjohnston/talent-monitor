import type { DashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";

// Third stage rebuilt with TrackShell's `sections` prop (see
// TrackRetentionImmigration.tsx for the pattern). Grouped per
// content/report-crosswalk.csv's own per-exhibit `proposed_web_role`/
// notes from Phase 1 — FIG403 is that CSV's own "companion to FIG402,"
// FIG406/407/TAB401/TAB402/FIG408 are its "STEM completion path" module
// (docs/report-crosswalk-notes.md's own biggest-consolidation call), and
// FIG409-411/TAB403/TAB404 are every remaining exhibit the CSV tagged
// "study abroad" — not a fresh grouping invented for this pass.
export function TrackFoundation({ ctx }: { ctx: DashboardContext }) {
  return (
    <TrackShell
      ctx={ctx}
      stage="foundation"
      heroId="FIG401"
      sections={[
        {
          title: "How US students compare internationally",
          ids: ["FIG402", "FIG403", "FIG404"],
        },
        {
          title: "The STEM completion path",
          ids: ["FIG406", "TAB401", "FIG407", "TAB402", "FIG408"],
        },
        {
          title: "Study abroad",
          ids: ["FIG409", "FIG410", "FIG411", "TAB403", "TAB404"],
        },
      ]}
    />
  );
}
