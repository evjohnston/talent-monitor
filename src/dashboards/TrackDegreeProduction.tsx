import type { TrackDashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";

// Second stage rebuilt with TrackShell's `sections` prop (see
// TrackRetentionImmigration.tsx for the first, and CLAUDE.md's
// "Dashboards" section for what `sections` actually does) — grouped by
// checking each exhibit's own real columns, not by title alone: FIG102-105
// all break the hero's own "doctorates awarded" headline down a different
// way (by degree level, by S&E-vs-not), FIG106-108/TAB101 all measure the
// international share of that same pipeline (by raw count, by degree
// level, by field), and FIG109/110 are the one real cross-national
// comparison (absolute and per-capita PhD production by country).
export function TrackDegreeProduction({ ctx }: { ctx: TrackDashboardContext }) {
  return (
    <TrackShell
      ctx={ctx}
      stage="degree-production"
      heroId="FIG101"
      sections={[
        {
          title: "The shape of American degree production",
          ids: ["FIG102", "FIG103", "FIG104", "FIG105"],
        },
        {
          title: "How international is the pipeline",
          ids: ["FIG106", "FIG107", "FIG108", "TAB101"],
        },
        {
          title: "Who's ahead globally",
          ids: ["FIG109", "FIG110"],
        },
      ]}
    />
  );
}
