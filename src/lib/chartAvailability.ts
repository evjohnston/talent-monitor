import type { Exhibit } from "./types.ts";

// Predicts, at Astro build time, whether an exhibit will actually get a
// real chart PNG once scripts/generate-downloads.ts runs (a later, real
// screenshot pass over the ALREADY-built site — this page can't wait for
// that to finish, so it predicts from the same real rendering logic
// ExhibitChart.tsx and TrackShell.tsx use, not a guess). Verified against
// the real, actual PNG output, not assumed: an earlier version of this
// predicate also counted BoxPlotRow (FIG512/FIG513) as SVG-producing,
// which is WRONG — confirmed by reading that component directly, it's
// plain absolutely-positioned HTML/CSS divs, the same real pattern
// BarRow.tsx uses, not an <svg>. Caught by diffing this predicate's own
// output against generate-downloads.ts's real generated file list (66
// predicted vs. 62 actually generated) rather than trusting the
// prediction on its own.
//
// timeseries/share-timeseries (Nivo SeriesChart) and country-map
// (WorldMap) render a real <svg>; the generic ranked-bar fallback
// (BarRow), TAB501's own bespoke BarRow case, leaderboard-years
// (Leaderboard.tsx), and the distribution-stats shape (BoxPlotRow) do
// not — all four confirmed by reading their real source, not inferred
// from `kind` alone.
//
// FIG601/FIG602 are a real, separate case: they never render as their
// own standalone panel anywhere (TrackRetentionImmigration.tsx's own
// `excludeIds` — their data feeds that stage's hero Sankey directly), so
// generate-downloads.ts's own page-sweep (which only screenshots real
// .panel elements) never encounters them regardless of chart kind. This
// is currently the ONLY real exclusion of this shape in the app (checked
// by grepping every Track*.tsx file for its own excludeIds usage).
const NEVER_RENDERED_STANDALONE = new Set(["FIG601", "FIG602"]);

export function hasChartSvg(exhibit: Exhibit): boolean {
  if (NEVER_RENDERED_STANDALONE.has(exhibit.id)) return false;
  return exhibit.kind === "timeseries" || exhibit.kind === "share-timeseries" || exhibit.kind === "country-map";
}
