import type { DashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";

export function TrackRetentionImmigration({ ctx }: { ctx: DashboardContext }) {
  return <TrackShell ctx={ctx} stage="retention-immigration" heroId="FIG602" />;
}
