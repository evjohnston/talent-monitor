import type { DashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";

export function TrackWorkforceEntry({ ctx }: { ctx: DashboardContext }) {
  return <TrackShell ctx={ctx} stage="workforce-entry" heroId="FIG303" />;
}
