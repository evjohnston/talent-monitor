import { useState } from "react";
import type { Exhibit } from "../lib/types.ts";
import type { MetricRegistryEntry } from "../lib/metricRegistry.ts";
import { ExhibitPanel } from "./ExhibitPanel.tsx";
import { ExhibitTable } from "./ExhibitTable.tsx";

const STAGE_LABEL: Record<string, string> = {
  foundation: "Foundation",
  "degree-production": "Degree Production",
  "graduate-training": "Graduate & Postdoctoral Training",
  "workforce-entry": "Workforce Entry",
  "retention-immigration": "Retention & Immigration",
  "research-output": "Research Output & Competitiveness",
};

// The explorer's own focused indicator view (issue #18, "explorer
// indicator detail" — second of the three planned PRs for this issue).
// Reuses ExhibitPanel directly (the real chart, its real controls, its
// real MethodologyDrawer with citation/downloads) rather than rebuilding
// any of that — the only genuinely new piece here is the chart/table
// toggle and the related-indicators list. "Report presets" (the issue's
// own wording) aren't a separate mechanism: this view's default state
// already reproduces the report's own real figure/table exactly, since
// that's just what ExhibitPanel always renders — a separate preset
// system would duplicate that, not add to it.
export function ExplorerDetail({
  exhibit,
  related,
  onClose,
  onOpenRelated,
}: {
  exhibit: Exhibit;
  related: MetricRegistryEntry[];
  onClose: () => void;
  onOpenRelated: (id: string) => void;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <div className="explorer-detail">
      <button type="button" className="link-btn" onClick={onClose} style={{ marginBottom: 8 }}>
        ← Back to explorer
      </button>

      <div className="tab-bar" style={{ marginBottom: 8 }}>
        <button type="button" className="chip" aria-pressed={view === "chart"} onClick={() => setView("chart")}>Chart</button>
        <button type="button" className="chip" aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button>
      </div>

      {view === "chart" ? <ExhibitPanel exhibit={exhibit} headingLevel={2} /> : (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>{exhibit.title}</h2>
          <ExhibitTable exhibit={exhibit} />
        </div>
      )}

      {related.length > 0 && (
        <div className="panel" style={{ marginTop: 8 }}>
          <h3 style={{ marginTop: 0 }}>Related indicators</h3>
          <ul className="explorer-related-list">
            {related.map((r) => (
              <li key={r.id}>
                <button type="button" className="link-btn" onClick={() => onOpenRelated(r.id)}>
                  {r.title}
                </button>
                <span className="trend-note"> — {STAGE_LABEL[r.stage] ?? r.stage}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
