// Generic extraction helpers that read an Exhibit's raw columns/rows (see
// types.ts) into the shape each chart component expects. Kept separate from
// the chart components themselves so a Track page can also reach for a
// single real number (e.g. "58,131 doctorates in 2024" for a KPI card)
// without importing a whole chart component just to compute it.
import type { Exhibit } from "./types.ts";
import { codeFromCountryName } from "./countries.ts";
import type { Series } from "../components/SeriesChart.tsx";
import type { YearsRow } from "../components/LeaderboardYears.tsx";

const isNum = (v: unknown): v is number => typeof v === "number";

function resolveCountryCode(name: string): string | null {
  return /^[A-Z]{2}$/.test(name) ? name : codeFromCountryName(name);
}

// Columns (excluding the leading key column) that carry at least one real
// numeric value — annotation/text columns (e.g. FIG101's "estimate" /
// "confirmed" flag column) are excluded rather than coerced.
export function numericColumns(exhibit: Exhibit): string[] {
  return exhibit.columns.slice(1).filter((c) => exhibit.rows.some((r) => isNum(r[c])));
}

function yearColumns(exhibit: Exhibit): string[] {
  return exhibit.columns.slice(1).filter((c) => /^\d{4}$/.test(c.trim()));
}

// A series counts as rate-shaped only when its real values ALL sit within
// [-1.5, 1.5] AND its name contains a rate/percent/share word — magnitude
// alone isn't enough (TAB404's real "Antarctica" study-abroad count is a
// genuine count that just happens to stay under 1.5), and an unanchored
// name match on "rate" isn't enough either (it would wrongly catch
// "doctorates"). Underscores are normalized to spaces first so "US_Share"
// still matches \bshare\b, which — being a real word-character in regex —
// it otherwise wouldn't. Used by ExhibitChart.tsx to split a timeseries
// that mixes a real rate column in among count columns (FIG603) onto its
// own axis instead of a shared one — see content/report-crosswalk.csv's
// own FIG603 caveat.
export function isRateShapedSeries(s: Series): boolean {
  return /\brate\b|\bpercent\b|\bshare\b|%/i.test(s.label.replace(/_/g, " ")) &&
    s.values.every((v) => v == null || Math.abs(v) <= 1.5);
}

// timeseries / share-timeseries: first column is the x-axis (usually
// "Year"), every other real-numeric column is its own series.
export function toSeriesChart(exhibit: Exhibit): { x: (string | number)[]; series: Series[] } {
  const xKey = exhibit.columns[0];
  const x = exhibit.rows.map((r) => (r[xKey] ?? "") as string | number);
  const series: Series[] = numericColumns(exhibit).map((c) => ({
    key: c,
    label: c,
    values: exhibit.rows.map((r) => (isNum(r[c]) ? r[c] : null)),
  }));
  return { x, series };
}

// Most recent real (non-null) value for one column — the "as of" number a
// KPI card or headline reads. Defaults to the first real-numeric column.
export function toLatestValue(exhibit: Exhibit, column?: string): { x: string | number; value: number } | null {
  const xKey = exhibit.columns[0];
  const col = column ?? numericColumns(exhibit)[0];
  if (!col) return null;
  for (let i = exhibit.rows.length - 1; i >= 0; i--) {
    const v = exhibit.rows[i][col];
    if (isNum(v)) return { x: (exhibit.rows[i][xKey] ?? "") as string | number, value: v };
  }
  return null;
}

// country-map: first column is a country name/code, one numeric column
// becomes the shaded value. Rows whose name doesn't resolve to a real
// country are dropped rather than guessed at.
export function toCountryMapValues(exhibit: Exhibit, column?: string): { values: Record<string, number>; column: string } | null {
  const nameKey = exhibit.columns[0];
  const col = column ?? numericColumns(exhibit)[0];
  if (!col) return null;
  const values: Record<string, number> = {};
  for (const r of exhibit.rows) {
    const nameRaw = r[nameKey];
    const v = r[col];
    if (typeof nameRaw !== "string" || !isNum(v)) continue;
    const code = resolveCountryCode(nameRaw);
    if (code) values[code] = v;
  }
  return { values, column: col };
}

// leaderboard-years: first column is an entity name, an optional second
// "Country" column, every 4-digit-header column is one fiscal/calendar year.
export function toLeaderboardYears(exhibit: Exhibit): { years: string[]; rows: YearsRow[] } {
  const nameKey = exhibit.columns[0];
  const countryKey = exhibit.columns[1] === "Country" ? exhibit.columns[1] : null;
  const years = yearColumns(exhibit);
  const rows: YearsRow[] = exhibit.rows.map((r) => ({
    name: String(r[nameKey] ?? ""),
    country: countryKey ? resolveCountryCode(String(r[countryKey] ?? "")) : null,
    valuesByYear: Object.fromEntries(years.map((y) => [y, isNum(r[y]) ? r[y] : null])),
  }));
  return { years, rows };
}

export interface DistributionStatsRow {
  label: string;
  mean: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  skewness?: number;
  kurtosis?: number;
}

// A real, recurring shape (FIG512, FIG513 — a 5-number summary per
// company/entity: min/25th/median/75th/max, plus mean/skewness/kurtosis)
// that the generic ranked-bar fallback used to flatten into ranking by
// whichever real-numeric column happened to come last (kurtosis — a real
// but, for a policy reader, fairly opaque statistic), throwing away the
// other 8 real columns entirely. Detected structurally (does the exhibit
// have all 5 real quantile-shaped columns?), not by exhibit id — a
// second exhibit already has this exact shape, so it's a recurring
// pattern to fix generally, not a one-off. See BoxPlotRow.tsx for the
// real box-and-whisker rendering this feeds.
const DIST_STATS_COLUMNS = ["min", "25th_percentile", "median_50th", "75th_percentile", "max"] as const;
const DIST_STATS_EXCLUDE = new Set([...DIST_STATS_COLUMNS, "mean", "std", "sum", "skewness", "kurtosis"]);

export function toDistributionStats(exhibit: Exhibit): { rows: DistributionStatsRow[] } | null {
  if (!DIST_STATS_COLUMNS.every((c) => exhibit.columns.includes(c)) || !exhibit.columns.includes("mean")) return null;
  const labelKeys = exhibit.columns.filter((c) => !DIST_STATS_EXCLUDE.has(c));
  const rows: DistributionStatsRow[] = [];
  for (const r of exhibit.rows) {
    const mean = r.mean, min = r.min, q1 = r["25th_percentile"], median = r.median_50th, q3 = r["75th_percentile"], max = r.max;
    if (![mean, min, q1, median, q3, max].every(isNum)) continue;
    // Same adjacent-identical-value dedup as toRankedBars — this shape
    // has the same real Country+Company leading-columns pattern.
    const parts: string[] = [];
    for (const k of labelKeys) {
      const v = String(r[k] ?? "").trim();
      if (v && v !== parts[parts.length - 1]) parts.push(v);
    }
    if (parts.length === 0) continue;
    rows.push({
      label: parts.join(" · "),
      mean: mean as number, min: min as number, q1: q1 as number, median: median as number, q3: q3 as number, max: max as number,
      skewness: isNum(r.skewness) ? r.skewness : undefined,
      kurtosis: isNum(r.kurtosis) ? r.kurtosis : undefined,
    });
  }
  if (rows.length === 0) return null;
  // Ranked by median, not mean — the more representative "typical" value
  // for a real, heavily right-skewed distribution (citation counts: a
  // handful of outlier papers/patents inflate the mean well above what a
  // typical entry looks like). The mean is still shown as its own marker
  // in the box plot itself, so the size of that gap stays visible.
  rows.sort((a, b) => b.median - a.median);
  return { rows };
}

// ranked-bar catch-all: every leading non-numeric column identifies a row
// (e.g. FIG512's Country+Company, TAB604's Country+Year+Status) — joined
// into one label, since the first column alone repeats across rows for
// these shapes and would otherwise collide. Ranked by the most recent
// real-numeric column (e.g. TAB506's 2025 patent count, not its 2005 one).
export function toRankedBars(exhibit: Exhibit, topN = 12): { rows: { label: string; value: number }[]; column: string; max: number; truncated: number } | null {
  const cols = numericColumns(exhibit);
  const col = cols[cols.length - 1];
  if (col === undefined) return null;
  const firstNumericIndex = exhibit.columns.findIndex((c) => cols.includes(c));
  const labelKeys = exhibit.columns.slice(0, Math.max(1, firstNumericIndex));
  const all = exhibit.rows
    .map((r) => {
      // Skip a leading column's value when it's identical to the one just
      // before it (a display name + its own normalized/lowercased key,
      // e.g. TAB501's "conference" + "conf_norm" — real, confirmed
      // duplication, not just similar) — otherwise it reads as "colt ·
      // colt" instead of just "colt".
      const parts: string[] = [];
      for (const k of labelKeys) {
        const v = String(r[k] ?? "").trim();
        if (v && v !== parts[parts.length - 1]) parts.push(v);
      }
      return { label: parts.join(" · "), value: r[col] };
    })
    .filter((r): r is { label: string; value: number } => isNum(r.value) && r.label !== "")
    .sort((a, b) => b.value - a.value);
  const rows = all.slice(0, topN);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return { rows, column: col, max, truncated: Math.max(0, all.length - rows.length) };
}

// Re-exported from dateRange.ts, not defined here — see that file's own
// note on why: this function has no real dependency on the type-only
// SeriesChart.tsx/LeaderboardYears.tsx imports above, and keeping it out
// of this file is what lets scripts/generate-downloads.ts (a Node build
// script, checked under tsconfig.node.json's own DOM/JSX-free project)
// import it without pulling in code that needs --jsx to even resolve.
export { realDateRange } from "./dateRange.ts";
