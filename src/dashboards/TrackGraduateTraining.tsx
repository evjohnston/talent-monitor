import type { DashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";

export function TrackGraduateTraining({ ctx }: { ctx: DashboardContext }) {
  return <TrackShell ctx={ctx} stage="graduate-training" heroId="FIG207" />;
}
