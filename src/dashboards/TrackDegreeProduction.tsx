import type { DashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";

export function TrackDegreeProduction({ ctx }: { ctx: DashboardContext }) {
  return <TrackShell ctx={ctx} stage="degree-production" heroId="FIG101" />;
}
