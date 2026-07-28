import type { DashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";

export function TrackFoundation({ ctx }: { ctx: DashboardContext }) {
  return <TrackShell ctx={ctx} stage="foundation" heroId="FIG401" />;
}
