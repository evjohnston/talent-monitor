// Shared geometry for a Sankey ribbon's particle effect: many dots, each
// moving along its OWN lane through the ribbon's real thickness — not a
// sparse handful crawling the centerline and not a dense but motionless
// scatter. This gets both at once.
//
// A d3-sankey link rendered via sankeyLinkHorizontal is a cubic Bezier
// `M x0,y0 C xm,y0 xm,y1 x1,y1` (control points sitting at the horizontal
// midpoint, each sharing its endpoint's y). Bezier curves are affine —
// translating every one of those y-values by the same constant shifts the
// whole curve by that constant without changing its shape. So a dot's own
// lane is just that identical S-curve, offset vertically by a fixed lateral
// jitter — its own real path string, used directly as SVG animateMotion's
// `path` attribute (no separate referenced <path> element needed). Many
// dots on many lanes, staggered start times, reproduces a dense, filled
// ribbon at any single instant while every dot genuinely travels the flow's
// real direction and shape.
export interface MotionDot {
  pathD: string;
  r: number;
  delay: number;
  dur: number;
}

const MAX_DOTS_PER_LINK = 40;

// Deterministic per-link/per-dot scatter — a stable hash, not Math.random().
// A real reroll on every render would make the whole texture flicker or
// restart every time React re-renders for an unrelated reason (a hover
// elsewhere, a filter change). Count scales with the link's real value
// relative to the diagram's max, capped so one huge link can't spawn
// hundreds of concurrently-animating SMIL elements.
// Rounded to 2 decimals before going into the path string — an SVG
// coordinate doesn't need float64's full precision, and the Astro
// migration made that precision actively harmful: Math.sin can return a
// value that differs from Node (the Astro build's SSR pass) by a couple
// ULPs versus the browser (the client hydration pass) despite identical
// inputs, which without rounding produced a real React hydration-mismatch
// warning on every page with a Sankey (confirmed by hand — server/client
// path strings differed only from the 12th significant digit onward).
const round2 = (n: number) => Math.round(n * 100) / 100;

export function scatterMotionDots(x0: number, y0: number, x1: number, y1: number, width: number, count: number, linkSeed: number): MotionDot[] {
  const n = Math.max(0, Math.min(MAX_DOTS_PER_LINK, Math.round(count)));
  const xm = (x0 + x1) / 2;
  const dots: MotionDot[] = [];
  for (let i = 0; i < n; i++) {
    const h2 = Math.sin(linkSeed * 39.346 + i * 11.135) * 24634.634;
    const u = (h2 - Math.floor(h2)) * 2 - 1; // -1..1, this dot's fixed lateral lane within the ribbon
    const h3 = Math.sin(linkSeed * 78.234 + i * 45.164) * 12321.987;
    const jitter = h3 - Math.floor(h3);
    const offset = u * (width / 2) * 0.85;
    const y0o = round2(y0 + offset);
    const y1o = round2(y1 + offset);
    dots.push({
      pathD: `M${round2(x0)},${y0o} C${round2(xm)},${y0o} ${round2(xm)},${y1o} ${round2(x1)},${y1o}`,
      r: round2(1.5 + Math.abs(u) * 1.0),
      delay: jitter * 4.5,
      dur: 3.6 + jitter * 2.6,
    });
  }
  return dots;
}
