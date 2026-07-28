import { useState, type ReactNode } from "react";
import type { Stage } from "../lib/types.ts";
import type { DashboardContext } from "./types.ts";
import { ExhibitPanel } from "../components/ExhibitPanel.tsx";
import { PolicyTakeaway } from "../components/ChartFrame.tsx";

// Shared shape for all 6 Track pages: the stage's latest analyst note as a
// one-sentence takeaway, one optional full-width "hero" (either a real
// exhibit picked by id, or custom content like a Sankey — see
// TrackRetentionImmigration.tsx), then every other real exhibit for that
// stage rendered as its own panel, three to a row. Every exhibit for a
// stage shows up somewhere — no silent top-N cut of the real data.
//
// Also owns the page's cross-highlight state: hovering a country on one
// exhibit's map emphasizes that same country on every other exhibit on
// this page that has a country dimension (see ExhibitChart.tsx/
// WorldMap.tsx's emphasize/onHoverCountry — this is just the shared state
// they both already knew how to use).
export function TrackShell({
  ctx,
  stage,
  heroId,
  heroContent,
}: {
  ctx: DashboardContext;
  stage: Stage;
  heroId?: string;
  heroContent?: ReactNode;
}) {
  const [emphasizeCountry, setEmphasizeCountry] = useState<string | null>(null);
  const exhibits = ctx.exhibitsByStage[stage];
  const note = ctx.latestNote[stage];
  const hero = heroId ? exhibits.find((e) => e.id === heroId) : undefined;
  const rest = hero ? exhibits.filter((e) => e.id !== hero.id) : exhibits;
  const rows: typeof rest[] = [];
  for (let i = 0; i < rest.length; i += 3) rows.push(rest.slice(i, i + 3));

  const emphasize = emphasizeCountry ? [emphasizeCountry] : undefined;

  return (
    <div className="track-enter" key={stage}>
      {note && <PolicyTakeaway>{note.headline} — {note.body}</PolicyTakeaway>}
      {heroContent}
      {hero && <ExhibitPanel exhibit={hero} emphasize={emphasize} onHoverCountry={setEmphasizeCountry} />}
      {rows.map((row, i) => (
        <div className="row3" key={i}>
          {row.map((e) => <ExhibitPanel key={e.id} exhibit={e} emphasize={emphasize} onHoverCountry={setEmphasizeCountry} />)}
        </div>
      ))}
      {exhibits.length === 0 && !heroContent && <div className="trend-empty">No exhibits imported for this stage yet.</div>}
    </div>
  );
}
