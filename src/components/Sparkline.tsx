// A tiny, axis-less trend line inside a KpiCard — the same real time
// series already computed for that card's headline number, just also
// drawn small rather than only stated as one number. No labels, no
// tooltip: this is a glance-level "is it rising or falling," not a chart
// in its own right (SeriesChart is that, on the exhibit's own panel).
export function Sparkline({ values, color = "var(--red)" }: { values: (number | null)[]; color?: string }) {
  const real = values.filter((v): v is number => v != null);
  if (real.length < 2) return null;
  const W = 70, H = 20, PAD = 2;
  const min = Math.min(...real), max = Math.max(...real);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i / (values.length - 1)) * (W - PAD * 2);
  const y = (v: number) => PAD + (1 - (v - min) / span) * (H - PAD * 2);
  let d = "";
  let drawing = false;
  values.forEach((v, i) => {
    if (v == null) { drawing = false; return; }
    d += `${drawing ? "L" : "M"} ${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
    drawing = true;
  });
  const lastIdx = values.map((v, i) => (v != null ? i : -1)).filter((i) => i >= 0).pop();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }} aria-hidden="true">
      <path d={d.trim()} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {lastIdx != null && real.length > 0 && (
        <circle cx={x(lastIdx)} cy={y(values[lastIdx] as number)} r={2} fill={color} />
      )}
    </svg>
  );
}
