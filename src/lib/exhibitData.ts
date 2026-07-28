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
