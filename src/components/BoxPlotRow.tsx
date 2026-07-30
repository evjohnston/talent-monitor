import { useState } from "react";
import { Tooltip } from "./Tooltip.tsx";
import type { DistributionStatsRow } from "../lib/exhibitData.ts";

// A real box-and-whisker row: min-max whisker, 25th-75th box, a median
// tick, and a separate mean marker — the real bespoke chart FIG512/513's
// own crosswalk note calls for ("today's generic ranked-bar throws away
// 8 of 9 real numeric columns"). Same row-list shape as BarRow.tsx
// (label | inline chart | headline number, hover for the rest), not a
// new visual language.
//
// Sqrt-scaled, not linear — the same "compress a real, heavily
// right-skewed, zero-floored distribution" approach WorldMap.tsx's own
// "count" mode already uses (see CLAUDE.md's country-map note), reused
// here rather than inventing a new scale for the same real problem: these
// distributions run from min=0 to a max in the tens of thousands, and a
// linear scale sized to fit that max would flatten every box down to an
// illegible sliver near zero.
function sqrtPct(value: number, domainMax: number): number {
  if (domainMax <= 0) return 0;
  return (Math.sqrt(Math.max(0, value) / domainMax) * 100);
}

export function BoxPlotRow({
  stats,
  domainMax,
  formatValue = (v) => Math.round(v).toLocaleString(),
}: {
  stats: DistributionStatsRow;
  domainMax: number;
  formatValue?: (v: number) => string;
}) {
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const minPct = sqrtPct(stats.min, domainMax);
  const q1Pct = sqrtPct(stats.q1, domainMax);
  const medianPct = sqrtPct(stats.median, domainMax);
  const q3Pct = sqrtPct(stats.q3, domainMax);
  const maxPct = sqrtPct(stats.max, domainMax);
  const meanPct = sqrtPct(stats.mean, domainMax);

  return (
    <div className="barrow boxplot-row" onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY })} onMouseLeave={() => setTip(null)}>
      <span className="name">{stats.label}</span>
      <div className="track boxplot-track">
        <div className="boxplot-whisker" style={{ left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }} />
        <div className="boxplot-box" style={{ left: `${q1Pct}%`, width: `${Math.max(0, q3Pct - q1Pct)}%` }} />
        <div className="boxplot-median" style={{ left: `${medianPct}%` }} />
        <div className="boxplot-mean" style={{ left: `${meanPct}%` }} title="mean" />
      </div>
      <span className="v num">{formatValue(stats.median)}</span>
      {tip && (
        <Tooltip x={tip.x} y={tip.y}>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>{stats.label}</div>
          <div>Median: {formatValue(stats.median)}</div>
          <div>Mean: {formatValue(stats.mean)}</div>
          <div>Range: {formatValue(stats.min)}–{formatValue(stats.max)}</div>
          <div>Middle 50%: {formatValue(stats.q1)}–{formatValue(stats.q3)}</div>
          {stats.skewness != null && <div>Skewness: {stats.skewness.toFixed(2)}</div>}
        </Tooltip>
      )}
    </div>
  );
}
