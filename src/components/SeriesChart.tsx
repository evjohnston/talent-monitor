import { useMemo, useRef, useState, type MouseEvent } from "react";
import { codeFromCountryName, countryColor, countryName } from "../lib/countries.ts";
import { Tooltip } from "./Tooltip.tsx";

export interface Series {
  key: string; // a real country name/code resolves to that country's real color; anything else cycles the categorical palette below
  label: string;
  values: (number | null)[]; // same length/order as `x`; null = no data at that point, not zero
}

// Repurposes the continent-color tokens (index.css) as a small, restrained
// qualitative palette for series that AREN'T countries (degree levels, test
// subjects, visa categories...) — these tokens went unused once country
// color reverted to the named-actor scheme (see countries.ts), so this
// reuses an existing, deliberately-small set rather than inventing a new
// decorative palette.
const CATEGORICAL = ["var(--cont-na)", "var(--cont-as)", "var(--cont-eu)", "var(--cont-sa)", "var(--cont-af)", "var(--cont-oc)", "var(--cont-me)"];

// Exhibit CSVs store country series under their real display name ("United
// States", "South Korea"), not an ISO code — resolve that name back to a
// code so a real country series gets the same color everywhere else in
// this app uses, instead of an arbitrary categorical color that happens to
// land on it.
function resolveCountry(key: string): string | null {
  return /^[A-Z]{2}$/.test(key) ? key : codeFromCountryName(key);
}

function colorFor(key: string, index: number): string {
  const code = resolveCountry(key);
  return code ? countryColor(code) : CATEGORICAL[index % CATEGORICAL.length];
}

function labelFor(key: string, label: string): string {
  const code = resolveCountry(key);
  return code ? countryName(code) : label;
}

// A generic line chart for "x (usually year) -> one or more named numeric
// series" — the shape most talent_charts exhibits are already in. Distinct
// from the old quantum/AI TrendChart, which was hard-coded to countries as
// the only possible series; here a series can be a country OR any other
// real named dimension (degree level, test subject, visa category...).
export function SeriesChart({
  x,
  series,
  formatValue = (v) => v.toLocaleString(),
  unitSuffix = "",
  emphasize,
}: {
  x: (string | number)[];
  series: Series[];
  formatValue?: (v: number) => string;
  unitSuffix?: string;
  emphasize?: string[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);

  const n = x.length;
  const W = 720, H = 260, padL = 40, padR = 14, padT = 14, padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const { yMin, yMax } = useMemo(() => {
    const all = series.flatMap((s) => s.values.filter((v): v is number => v != null));
    if (all.length === 0) return { yMin: 0, yMax: 1 };
    const rawMin = Math.min(0, ...all);
    const rawMax = Math.max(...all);
    const span = rawMax - rawMin || 1;
    return { yMin: rawMin, yMax: rawMax + span * 0.08 };
  }, [series]);

  const xPos = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const yPos = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin || 1)) * plotH;

  const linePath = (values: (number | null)[]) => {
    let d = "";
    let drawing = false;
    values.forEach((v, i) => {
      if (v == null) { drawing = false; return; }
      d += `${drawing ? "L" : "M"} ${xPos(i).toFixed(1)} ${yPos(v).toFixed(1)} `;
      drawing = true;
    });
    return d.trim();
  };

  function handleMove(e: MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((relX - padL) / plotW) * (n - 1));
    setHover({ i: Math.max(0, Math.min(n - 1, i)), x: e.clientX, y: e.clientY });
  }

  const gridVals = [yMin, yMin + (yMax - yMin) * 0.25, yMin + (yMax - yMin) * 0.5, yMin + (yMax - yMin) * 0.75, yMax];
  const showEndpointLabels = series.length <= 6;

  if (n === 0 || series.length === 0) {
    return <div className="trend-empty">No data for this exhibit.</div>;
  }

  return (
    <figure style={{ margin: 0 }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" width="100%" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={yPos(v)} x2={W - padR} y2={yPos(v)} stroke="var(--line)" strokeWidth="1" />
            <text x={padL - 5} y={yPos(v) + 3} textAnchor="end" fontSize="9" fill="var(--mist)">{formatValue(Math.round(v * 100) / 100)}{unitSuffix}</text>
          </g>
        ))}
        {series.map((s, i) => {
          const faded = !!emphasize?.length && !emphasize.includes(s.key);
          return <path key={s.key} d={linePath(s.values)} fill="none" stroke={colorFor(s.key, i)} strokeWidth="2" strokeLinejoin="round" opacity={faded ? 0.25 : 1} />;
        })}
        {series.map((s, i) =>
          s.values.map((v, vi) =>
            v == null ? null : (
              <circle key={`${s.key}-${vi}`} cx={xPos(vi)} cy={yPos(v)} r={vi === n - 1 ? 3 : 1.5} fill={colorFor(s.key, i)} opacity={!!emphasize?.length && !emphasize.includes(s.key) ? 0.25 : 1} />
            )
          )
        )}
        {showEndpointLabels && series.map((s, i) => {
          const lastIdx = s.values.map((v, vi) => (v != null ? vi : -1)).filter((vi) => vi >= 0).pop();
          if (lastIdx == null) return null;
          const v = s.values[lastIdx]!;
          return (
            <text key={`lbl-${s.key}`} x={xPos(lastIdx) + (lastIdx === n - 1 ? -6 : 6)} y={yPos(v) - 5} textAnchor={lastIdx === n - 1 ? "end" : "start"} fontSize="9" fill={colorFor(s.key, i)}>
              {formatValue(v)}{unitSuffix}
            </text>
          );
        })}
        {hover && <line x1={xPos(hover.i)} y1={padT} x2={xPos(hover.i)} y2={H - padB} stroke="var(--ink-2)" strokeWidth="1" strokeDasharray="2 2" />}
        <text x={padL} y={H - 6} fontSize="9" fill="var(--mist)">{x[0]}</text>
        <text x={W - padR} y={H - 6} textAnchor="end" fontSize="9" fill="var(--mist)">{x[n - 1]}</text>
      </svg>
      {hover && (
        <Tooltip x={hover.x} y={hover.y}>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>{x[hover.i]}</div>
          {series.map((s) => {
            const v = s.values[hover.i];
            return v == null ? null : <div key={s.key}>{labelFor(s.key, s.label)}: {formatValue(v)}{unitSuffix}</div>;
          })}
        </Tooltip>
      )}
      <figcaption className="trend-legend">
        {series.map((s, i) => (
          <span key={s.key} className="legend-item">
            <span className="swatch" style={{ background: colorFor(s.key, i) }} />
            {labelFor(s.key, s.label)}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
