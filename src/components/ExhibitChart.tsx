import type { Exhibit } from "../lib/types.ts";
import { toSeriesChart, toCountryMapValues, toLeaderboardYears, toRankedBars } from "../lib/exhibitData.ts";
import { SeriesChart } from "./SeriesChart.tsx";
import { WorldMap } from "./WorldMap.tsx";
import { LeaderboardYears } from "./LeaderboardYears.tsx";
import { BarRow } from "./BarRow.tsx";

// Dispatches one real Exhibit to the chart shape that fits its `kind` (see
// scripts/import-talent-charts.ts for how `kind` gets assigned). Generic on
// purpose — this is what lets 6 new Track pages share one rendering path
// across ~80 differently-shaped real exhibits instead of one bespoke
// component per figure.
export function ExhibitChart({ exhibit }: { exhibit: Exhibit }) {
  if (exhibit.kind === "timeseries" || exhibit.kind === "share-timeseries") {
    const { x, series } = toSeriesChart(exhibit);
    // share-timeseries exhibits store either a raw 0-1 fraction (needs
    // x100 to read as a percent) or an already-computed percentage point
    // (FIG207's columns are literally named "Percent of ... post-docs") —
    // detected from the real data range, not assumed from `kind` alone.
    const isFraction = exhibit.kind === "share-timeseries" && series.every((s) => s.values.every((v) => v == null || Math.abs(v) <= 1.5));
    const scaled = isFraction ? series.map((s) => ({ ...s, values: s.values.map((v) => (v == null ? null : v * 100)) })) : series;
    return (
      <SeriesChart
        x={x}
        series={scaled}
        unitSuffix={exhibit.kind === "share-timeseries" ? "%" : ""}
        formatValue={(v) => (exhibit.kind === "share-timeseries" ? v.toFixed(1) : v.toLocaleString())}
      />
    );
  }

  if (exhibit.kind === "country-map") {
    const cm = toCountryMapValues(exhibit);
    if (!cm) return <div className="trend-empty">No data for this exhibit.</div>;
    // A score/rate/gap doesn't have a real zero floor the way a count does
    // (PISA means cluster ~400-600; a "gap with native-born" can go
    // negative) — detected from the real values, not assumed from `kind`.
    const vals = Object.values(cm.values);
    const min = vals.length ? Math.min(...vals) : 0;
    const max = vals.length ? Math.max(...vals) : 1;
    const mode = min < 0 || (max > 0 && min > max * 0.2) ? "range" : "count";
    return <WorldMap values={cm.values} unit={cm.column} mode={mode} />;
  }

  if (exhibit.kind === "leaderboard-years") {
    const { years, rows } = toLeaderboardYears(exhibit);
    if (years.length === 0) return <div className="trend-empty">No data for this exhibit.</div>;
    return <LeaderboardYears years={years} rows={rows} nameLabel={exhibit.columns[0]} />;
  }

  // ranked-bar, and the generic fallback for any shape that doesn't
  // cleanly fit the other four.
  const rb = toRankedBars(exhibit);
  if (!rb || rb.rows.length === 0) return <div className="trend-empty">No data for this exhibit.</div>;
  return (
    <div>
      {rb.rows.map((r, i) => (
        <BarRow
          key={`${r.label}-${i}`}
          label={r.label}
          pct={(r.value / rb.max) * 100}
          color="var(--red)"
          valueLabel={r.value.toLocaleString()}
          detail={`${r.label} · ${r.value.toLocaleString()} (${rb.column})`}
        />
      ))}
      {rb.truncated > 0 && <div className="trend-note" style={{ marginTop: 6 }}>+{rb.truncated} more not shown.</div>}
    </div>
  );
}
