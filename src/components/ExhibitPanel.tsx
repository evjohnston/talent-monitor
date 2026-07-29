import type { Exhibit } from "../lib/types.ts";
import { SectionHeader, ExpandableMethods } from "./ChartFrame.tsx";
import { ExhibitChart } from "./ExhibitChart.tsx";
import { downloadCsv } from "../lib/csvExport.ts";

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
  return (
    <div className="panel">
      <SectionHeader title={exhibit.title} takeaway={takeaway} level={headingLevel} />
      <ExhibitChart exhibit={exhibit} emphasize={emphasize} onHoverCountry={onHoverCountry} onSelectCountry={onSelectCountry} />
      <ExpandableMethods summary={exhibit.sourceShort}>
        <p>{exhibit.sourceLong}</p>
        {exhibit.sourceUrls.map((u) => (
          <div key={u}><a href={u} target="_blank" rel="noreferrer">{u}</a></div>
        ))}
        <button type="button" className="ghost-btn download-csv-btn" onClick={() => downloadCsv(`${exhibit.id}.csv`, exhibit.rows)}>
          Download this exhibit's data (CSV)
        </button>
      </ExpandableMethods>
    </div>
  );
}
