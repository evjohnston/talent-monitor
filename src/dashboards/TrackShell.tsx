import { useState, type ReactNode } from "react";
import type { Exhibit, Stage } from "../lib/types.ts";
import type { DashboardContext } from "./types.ts";
import { ExhibitPanel } from "../components/ExhibitPanel.tsx";
import { PolicyTakeaway, SectionHeader } from "../components/ChartFrame.tsx";

// A named group of exhibits within a stage — see TrackRetentionImmigration
// for the first real use. Real editorial reasoning, not an arbitrary
// chunking of N exhibits into rows of 3: each section title states what
// question that group of exhibits actually answers together.
export interface TrackSection {
  title: string;
  ids: string[];
}

// Shared shape for all 6 Track pages: the stage's latest analyst note as a
// one-sentence takeaway, one optional full-width "hero" (either a real
// exhibit picked by id, or custom content like a Sankey — see
// TrackRetentionImmigration.tsx), then every other real exhibit for that
// stage rendered as its own panel. Every exhibit for a stage shows up
// somewhere — no silent top-N cut of the real data.
//
// Two ways the "every other exhibit" part can render:
// - Default (no `sections` prop): one flat grid, three panels a row —
//   still every other stage's actual current behavior.
// - `sections`: named editorial groups (see TrackSection above), each its
//   own sub-heading and row. Any real exhibit for the stage that ISN'T
//   named in any section still renders, in a final flat-grid fallback —
//   a fresh data refresh adding an exhibit this hand-authored section
//   list doesn't know about yet degrades to "shows up, ungrouped," never
//   "silently disappears."
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
  excludeIds,
  sections,
}: {
  ctx: DashboardContext;
  stage: Stage;
  heroId?: string;
  heroContent?: ReactNode;
  // Exhibits that feed heroContent's own numbers directly (e.g. a Sankey
  // built from two exhibits' data) and would otherwise duplicate — appear
  // once, in the hero, not again as their own standalone panel below it.
  excludeIds?: string[];
  sections?: TrackSection[];
}) {
  const [emphasizeCountry, setEmphasizeCountry] = useState<string | null>(null);
  const exhibits = ctx.exhibitsByStage[stage];
  const note = ctx.latestNote[stage];
  const hero = heroId ? exhibits.find((e) => e.id === heroId) : undefined;
  const excluded = new Set([...(excludeIds ?? []), ...(hero ? [hero.id] : [])]);
  const rest = exhibits.filter((e) => !excluded.has(e.id));

  const emphasize = emphasizeCountry ? [emphasizeCountry] : undefined;

  function renderRow(row: Exhibit[]) {
    return (
      <div className="row3" key={row.map((e) => e.id).join("-")}>
        {row.map((e) => <ExhibitPanel key={e.id} exhibit={e} emphasize={emphasize} onHoverCountry={setEmphasizeCountry} />)}
      </div>
    );
  }

  function toRows(list: Exhibit[]) {
    const rows: Exhibit[][] = [];
    for (let i = 0; i < list.length; i += 3) rows.push(list.slice(i, i + 3));
    return rows.map(renderRow);
  }

  let body: ReactNode;
  if (sections) {
    const byId = Object.fromEntries(rest.map((e) => [e.id, e]));
    const seen = new Set<string>();
    const sectionNodes = sections.map((s) => {
      const items = s.ids.map((id) => byId[id]).filter((e): e is Exhibit => !!e);
      items.forEach((e) => seen.add(e.id));
      if (items.length === 0) return null;
      return (
        <div className="track-section" key={s.title}>
          <SectionHeader title={s.title} />
          {renderRow(items)}
        </div>
      );
    });
    const leftover = rest.filter((e) => !seen.has(e.id));
    body = (
      <>
        {sectionNodes}
        {toRows(leftover)}
      </>
    );
  } else {
    body = toRows(rest);
  }

  return (
    <div className="track-enter" key={stage}>
      {note && <PolicyTakeaway>{note.headline} — {note.body}</PolicyTakeaway>}
      {heroContent}
      {hero && <ExhibitPanel exhibit={hero} emphasize={emphasize} onHoverCountry={setEmphasizeCountry} />}
      {body}
      {exhibits.length === 0 && !heroContent && <div className="trend-empty">No exhibits imported for this stage yet.</div>}
    </div>
  );
}
