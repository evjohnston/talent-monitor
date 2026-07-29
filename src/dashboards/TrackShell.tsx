import { useEffect, useState, type ReactNode } from "react";
import type { Exhibit, Stage } from "../lib/types.ts";
import type { DashboardContext } from "./types.ts";
import { ExhibitPanel } from "../components/ExhibitPanel.tsx";
import { PolicyTakeaway, SectionHeader } from "../components/ChartFrame.tsx";
import { countryName } from "../lib/countries.ts";
import { readPinnedCountryFromUrl, writePinnedCountryToUrl } from "../lib/urlState.ts";

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
// they both already knew how to use), and clicking a country PINS that
// highlight so it survives after the mouse leaves the map — real
// interactivity for WorldMap.tsx's own onSelect prop, which every current
// caller left unwired until now (a real gap the Phase 0 UX audit caught:
// "no map is clickable or keyboard-reachable anywhere in the app today").
// A hover always takes priority over a pin while it's active (a quick
// peek at a different country doesn't require unpinning first), falling
// back to the pinned country the moment the mouse leaves.
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
  // Starts null on both the server render and the client's first render
  // (no lazy `window`-reading initializer) so hydration always matches —
  // the real ?country= value, if any, is only read after mount, the same
  // SSR-safety pattern ThemeToggle.tsx already uses for its own initial
  // value. One harmless extra render right after mount when a pin IS
  // present in the URL; no hydration-mismatch warning either way.
  const [pinnedCountry, setPinnedCountry] = useState<string | null>(null);
  useEffect(() => {
    const fromUrl = readPinnedCountryFromUrl();
    if (fromUrl) setPinnedCountry(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    writePinnedCountryToUrl(pinnedCountry);
  }, [pinnedCountry]);
  const exhibits = ctx.exhibitsByStage[stage];
  const note = ctx.latestNote[stage];
  const hero = heroId ? exhibits.find((e) => e.id === heroId) : undefined;
  const excluded = new Set([...(excludeIds ?? []), ...(hero ? [hero.id] : [])]);
  const rest = exhibits.filter((e) => !excluded.has(e.id));

  const effectiveCountry = emphasizeCountry ?? pinnedCountry;
  const emphasize = effectiveCountry ? [effectiveCountry] : undefined;
  // Click the same pinned country again to unpin — the natural toggle a
  // reader expects, same as clicking an already-active filter chip.
  const handleSelect = (code: string) => setPinnedCountry((prev) => (prev === code ? null : code));

  function renderRow(row: Exhibit[]) {
    return (
      <div className="row3" key={row.map((e) => e.id).join("-")}>
        {row.map((e) => <ExhibitPanel key={e.id} exhibit={e} emphasize={emphasize} onHoverCountry={setEmphasizeCountry} onSelectCountry={handleSelect} />)}
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
      {pinnedCountry && (
        <div className="pinned-country-bar">
          Pinned: <strong>{countryName(pinnedCountry)}</strong> — highlighted on every map/chart below.
          <button type="button" className="ghost-btn" onClick={() => setPinnedCountry(null)}>Clear</button>
        </div>
      )}
      {heroContent}
      {hero && <ExhibitPanel exhibit={hero} emphasize={emphasize} onHoverCountry={setEmphasizeCountry} onSelectCountry={handleSelect} />}
      {body}
      {exhibits.length === 0 && !heroContent && <div className="trend-empty">No exhibits imported for this stage yet.</div>}
    </div>
  );
}
