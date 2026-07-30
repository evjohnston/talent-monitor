import { useState } from "react";
import { SeriesChart } from "./SeriesChart.tsx";
import type { DegreeLevelPoint, FieldShareBookend } from "../lib/scrollyData.ts";

// The real overall time series (FIG108) by default; selecting a field
// switches to TAB101's own real bookend comparison for that field — a
// real snapshot, not a fabricated trend line, since TAB101 has no full
// time series per field, only a real first-year/last-year pair.
export function DegreeLevelExplorer({ overall, fields }: { overall: DegreeLevelPoint[]; fields: FieldShareBookend[] }) {
  const [field, setField] = useState<string | null>(null);
  const selected = field ? fields.find((f) => f.field === field) : null;

  if (selected) {
    const max = Math.max(selected.bachelors, selected.masters, selected.doctorate);
    return (
      <div>
        <div className="tab-bar" style={{ marginBottom: 8 }}>
          <button type="button" className="chip" onClick={() => setField(null)}>← All fields, over time</button>
        </div>
        <div className="trend-note" style={{ marginBottom: 6 }}>{selected.field}, most recent real year</div>
        {(["bachelors", "masters", "doctorate"] as const).map((level) => (
          <div className="barrow" key={level}>
            <span className="name">{level[0].toUpperCase() + level.slice(1)}</span>
            <div className="track"><div className="fill" style={{ width: `${(selected[level] / max) * 100}%`, background: "var(--red)" }} /></div>
            <span className="v num">{selected[level].toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  }

  const x = overall.map((p) => p.year);
  const series = [
    { key: "Bachelors", label: "Bachelor's", values: overall.map((p) => p.bachelors) },
    { key: "Masters", label: "Master's", values: overall.map((p) => p.masters) },
    { key: "Doctorate", label: "Doctorate", values: overall.map((p) => p.doctorate) },
  ];

  return (
    <div>
      <SeriesChart x={x} series={series} unitSuffix="%" formatValue={(v) => v.toFixed(1)} ariaLabel="International share of STEM degrees by level" />
      {fields.length > 0 && (
        <div className="tab-bar" style={{ marginTop: 8 }}>
          <span className="trend-note" style={{ marginLeft: 0, marginRight: 6 }}>By field:</span>
          {fields.map((f) => (
            <button key={f.field} type="button" className="chip" onClick={() => setField(f.field)}>{f.field}</button>
          ))}
        </div>
      )}
    </div>
  );
}
