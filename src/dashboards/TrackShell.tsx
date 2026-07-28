import type { Stage } from "../lib/types.ts";
import type { DashboardContext } from "./types.ts";
import { ExhibitPanel } from "../components/ExhibitPanel.tsx";
import { PolicyTakeaway } from "../components/ChartFrame.tsx";

// Shared shape for all 6 Track pages: the stage's latest analyst note as a
// one-sentence takeaway, one optional full-width "hero" exhibit (the one
// the note is grounded in), then every other real exhibit for that stage
// rendered as its own panel, three to a row. Every exhibit for a stage
// shows up somewhere — no silent top-N cut of the real data.
export function TrackShell({ ctx, stage, heroId }: { ctx: DashboardContext; stage: Stage; heroId?: string }) {
  const exhibits = ctx.exhibitsByStage[stage];
  const note = ctx.latestNote[stage];
  const hero = heroId ? exhibits.find((e) => e.id === heroId) : undefined;
  const rest = hero ? exhibits.filter((e) => e.id !== hero.id) : exhibits;
  const rows: typeof rest[] = [];
  for (let i = 0; i < rest.length; i += 3) rows.push(rest.slice(i, i + 3));

  return (
    <div>
      {note && <PolicyTakeaway>{note.headline} — {note.body}</PolicyTakeaway>}
      {hero && <ExhibitPanel exhibit={hero} />}
      {rows.map((row, i) => (
        <div className="row3" key={i}>
          {row.map((e) => <ExhibitPanel key={e.id} exhibit={e} />)}
        </div>
      ))}
      {exhibits.length === 0 && <div className="trend-empty">No exhibits imported for this stage yet.</div>}
    </div>
  );
}
