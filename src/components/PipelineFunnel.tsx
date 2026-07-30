import type { PipelineStage } from "../lib/scrollyData.ts";

const GROUP_COLOR: Record<PipelineStage["group"], string> = {
  stem: "var(--red)",
  "left-stem": "var(--slate)",
  "in-progress": "var(--line-2)",
  "left-college": "var(--ink-2)",
};

// A real bar per real TAB401 outcome — deliberately plain horizontal bars
// (BarRow's own established pattern), not a Sankey implying a single
// flow with real sequential ordering TAB401's own data doesn't have (it's
// five real, mutually exclusive outcome shares of one cohort, not five
// sequential stages).
export function PipelineFunnel({ cohort, stages }: { cohort: string; stages: PipelineStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.pct));
  return (
    <div>
      <div className="trend-note" style={{ marginBottom: 6 }}>STEM entrants, {cohort} cohort</div>
      {stages.map((s) => (
        <div className="barrow barrow-wide" key={s.label}>
          <span className="name">{s.label}</span>
          <div className="track">
            <div className="fill" style={{ width: `${(s.pct / max) * 100}%`, background: GROUP_COLOR[s.group] }} />
          </div>
          <span className="v num">{s.pct.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
