import type { Exhibit } from "./types.ts";

// Split out of exhibitData.ts deliberately (2026-07-30) — that file's
// OTHER exports have type-only imports from SeriesChart.tsx/
// LeaderboardYears.tsx (real .tsx files, needing --jsx to even resolve),
// which is fine for every browser-context caller but breaks
// scripts/generate-downloads.ts, a Node build script checked under
// tsconfig.node.json's own DOM/JSX-free project. realDateRange has no
// real dependency on either of those component files, so it lives here
// instead, with zero cross-project baggage — exhibitData.ts re-exports it
// so every existing browser-context import site keeps working unchanged.
//
// A real date range for MethodologyDrawer.tsx (and now generate-
// downloads.ts's own filenames), computed from the exhibit's own rows
// rather than hand-authored — never goes stale on a data refresh. Looks
// for a column literally named "Year" (every timeseries/share-timeseries/
// leaderboard-years exhibit has one); a country-map or ranked-bar
// snapshot exhibit usually doesn't, and simply gets no date-range value
// rather than a fabricated one.
export function realDateRange(exhibit: Exhibit): string | null {
  const yearCol = exhibit.columns.find((c) => /^year$/i.test(c));
  if (!yearCol) return null;
  const years = exhibit.rows.map((r) => r[yearCol]).filter((v): v is number => typeof v === "number");
  if (years.length === 0) return null;
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
}
