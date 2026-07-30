import { useState } from "react";
import type { ResearchMetric } from "../lib/scrollyData.ts";

const CHIP_LABEL: Record<string, string> = {
  conferences: "Conferences",
  publications: "Publications",
  patents: "Patents",
  rd: "R&D",
};

// One real US-vs-China measure at a time — never a composite score
// combining unrelated units (a share and a raw count can't be added
// together honestly). Chip-based switcher, the same pattern SeriesChart's
// own series picker and LeaderboardYears' year-chip already use.
export function ResearchMetricSwitcher({ metrics }: { metrics: ResearchMetric[] }) {
  const [key, setKey] = useState(metrics[0]?.key);
  const metric = metrics.find((m) => m.key === key) ?? metrics[0];
  if (!metric) return <div className="trend-empty">No data for this exhibit.</div>;

  const max = Math.max(metric.us, metric.china);
  const format = (v: number) => (metric.unit === "share" ? `${v.toFixed(1)}%` : Math.round(v).toLocaleString());

  return (
    <div>
      <div className="tab-bar" style={{ marginBottom: 8 }}>
        {metrics.map((m) => (
          <button key={m.key} type="button" className="chip" aria-pressed={m.key === metric.key} onClick={() => setKey(m.key)}>
            {CHIP_LABEL[m.key] ?? m.key}
          </button>
        ))}
      </div>
      <div className="trend-note" style={{ marginBottom: 6 }}>{metric.label}, {metric.year}</div>
      <div className="barrow">
        <span className="name">United States</span>
        <div className="track"><div className="fill" style={{ width: `${(metric.us / max) * 100}%`, background: "var(--country-us)" }} /></div>
        <span className="v num">{format(metric.us)}</span>
      </div>
      <div className="barrow">
        <span className="name">China</span>
        <div className="track"><div className="fill" style={{ width: `${(metric.china / max) * 100}%`, background: "var(--country-cn)" }} /></div>
        <span className="v num">{format(metric.china)}</span>
      </div>
    </div>
  );
}
