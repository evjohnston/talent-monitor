import type { DashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";

export function TrackResearchOutput({ ctx }: { ctx: DashboardContext }) {
  return <TrackShell ctx={ctx} stage="research-output" heroId="TAB506" />;
}
