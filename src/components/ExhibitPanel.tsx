import { useRef } from "react";
import type { Exhibit } from "../lib/types.ts";
import { SectionHeader } from "./ChartFrame.tsx";
import { ExhibitChart } from "./ExhibitChart.tsx";
import { MethodologyDrawer } from "./MethodologyDrawer.tsx";

// One exhibit, one panel: real title, real chart, real citation. Every
// Track page is built by picking which exhibits go in which panel and
// handing each one to this — the citation footer is never optional, since
// every number here traces to a specific source (see talent_charts/
// titles_and_sources.csv).
export function ExhibitPanel({
  exhibit,
  takeaway,
  emphasize,
  onHoverCountry,
  onSelectCountry,
  headingLevel,
}: {
  exhibit: Exhibit;
  takeaway?: string;
  emphasize?: string[];
  onHoverCountry?: (code: string | null) => void;
  onSelectCountry?: (code: string) => void;
  // A stage's single full-width hero exhibit sits one level above an
  // ordinary panel in the page's real heading hierarchy (see
  // ChartFrame.tsx's SectionHeader) — TrackShell passes 2 for that one
  // case; every regular panel leaves this unset and gets the default h3.
  headingLevel?: 2 | 3;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  return (
    <div className="panel">
      <SectionHeader title={exhibit.title} takeaway={takeaway} level={headingLevel} />
      <div ref={chartRef}>
        <ExhibitChart exhibit={exhibit} emphasize={emphasize} onHoverCountry={onHoverCountry} onSelectCountry={onSelectCountry} />
      </div>
      <MethodologyDrawer exhibit={exhibit} chartRef={chartRef} />
    </div>
  );
}
