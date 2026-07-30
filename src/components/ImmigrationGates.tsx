import type { ImmigrationGate } from "../lib/scrollyData.ts";

// A real sequence of gates, each annotated with one real, hand-confirmed
// fact from a different exhibit (see scrollyData.ts's own note on why
// this is 5 separate real facts, not one fabricated cohort tracked
// through all of them) — deliberately NOT a Sankey or flow diagram
// implying a single real population moving through every stage in order.
export function ImmigrationGates({ gates }: { gates: ImmigrationGate[] }) {
  if (gates.length === 0) return <div className="trend-empty">No data for this exhibit.</div>;
  return (
    <ol className="gates-list">
      {gates.map((g, i) => (
        <li key={g.label} className="gates-item">
          <span className="gates-num">{i + 1}</span>
          <div>
            <div className="gates-label">{g.label}</div>
            <div className="gates-fact">{g.fact}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
