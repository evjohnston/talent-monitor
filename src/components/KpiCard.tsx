import { useCountUp } from "../lib/useCountUp.ts";
import { Sparkline } from "./Sparkline.tsx";

export function KpiCard({
  label,
  value,
  numeric,
  formatValue,
  delta,
  caption,
  highlight,
  span2,
  sparkline,
}: {
  label: string;
  value: string;
  // When both are given, the card animates a real count-up from 0 to
  // `numeric` on mount, formatting each in-between frame with
  // `formatValue` — `value` becomes the fallback for reduced-motion/no-JS.
  // Omit both and the card just shows `value` as a static string.
  numeric?: number;
  formatValue?: (n: number) => string;
  delta?: string | null;
  caption: string;
  highlight?: boolean;
  // Spans 2 grid columns — used by the country-filtered 5-unit metric row
  // (3 one-unit cards + 1 two-unit institution/organization card), where a
  // long institution name needs real room without breaking the row's
  // total width.
  span2?: boolean;
  // The same real time series already computed for this KPI's headline
  // number, drawn small — see Sparkline.tsx.
  sparkline?: (number | null)[];
}) {
  // Called unconditionally (rules of hooks) — the target is meaningless
  // when numeric/formatValue aren't both supplied, but that's fine, since
  // its result is only used below in that case.
  const countUp = useCountUp(numeric ?? 0);
  const animated = numeric != null && formatValue ? formatValue(countUp) : value;
  return (
    <div className={`panel kpi${highlight ? " hi" : ""}${span2 ? " kpi-span2" : ""}`}>
      <div className="label">{label}</div>
      <div className="val num">
        {animated}
        {delta && <span className="delta">{delta}</span>}
      </div>
      <div className="cap">{caption}</div>
      {sparkline && (
        <div className="kpi-spark">
          <Sparkline values={sparkline} color={highlight ? "#fff" : "var(--red)"} />
        </div>
      )}
    </div>
  );
}
