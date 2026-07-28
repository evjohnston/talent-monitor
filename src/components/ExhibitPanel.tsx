import type { Exhibit } from "../lib/types.ts";
import { SectionHeader, ExpandableMethods } from "./ChartFrame.tsx";
import { ExhibitChart } from "./ExhibitChart.tsx";

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
}: {
  exhibit: Exhibit;
  takeaway?: string;
  emphasize?: string[];
  onHoverCountry?: (code: string | null) => void;
}) {
  return (
    <div className="panel">
      <SectionHeader title={exhibit.title} takeaway={takeaway} />
      <ExhibitChart exhibit={exhibit} emphasize={emphasize} onHoverCountry={onHoverCountry} />
      <ExpandableMethods summary={exhibit.sourceShort}>
        <p>{exhibit.sourceLong}</p>
        {exhibit.sourceUrls.map((u) => (
          <div key={u}><a href={u} target="_blank" rel="noreferrer">{u}</a></div>
        ))}
      </ExpandableMethods>
    </div>
  );
}
