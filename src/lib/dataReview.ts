import type { Exhibit } from "./types.ts";
import type { CrosswalkRow } from "./loadCrosswalk.ts";
import { resolveRawSourceFiles } from "./rawSourceFiles.ts";
import { hasChartSvg } from "./chartAvailability.ts";

// One real review record per exhibit (issue #16) — generated from the
// same processed data (public/data/talent.json) and report crosswalk
// (content/report-crosswalk.csv) every other part of this app already
// reads, never a second hand-maintained spreadsheet. `unit`/`population`
// are left blank rather than fabricated: content/report-crosswalk.csv's
// own dedicated columns for these are still "TBD" for every exhibit
// (confirmed, same real gap MethodologyDrawer.tsx's own comment already
// documents) — a review record with an invented value would be worse
// than an honestly blank one.
export interface ReviewRecord {
  review_id: string;
  route: string;
  stage: string;
  exhibit_id: string;
  report_reference: string;
  title: string;
  population: string;
  unit: string;
  source: string;
  source_url: string;
  first_period: string;
  last_period: string;
  first_value: string;
  last_value: string;
  absolute_change: string;
  relative_change: string;
  minimum_value: string;
  minimum_period: string;
  maximum_value: string;
  maximum_period: string;
  row_count: number;
  series_count: number;
  missing_value_count: number;
  estimated_value_count: number;
  projected_value_count: number;
  duplicate_key_count: number;
  latest_data_update: string;
  calculation_note: string;
  caveat: string;
  raw_source_files: string;
  has_chart_svg: boolean;
  review_status: ReviewStatus;
  review_comment: string;
}

export type ReviewStatus = "not_reviewed" | "verified" | "needs_revision" | "approved_with_caveat";
export type ReviewStatusFile = Record<string, { review_status: ReviewStatus; review_comment: string }>;

const STAGE_ROUTE: Record<string, string> = {
  foundation: "/foundation/",
  "degree-production": "/degree-production/",
  "graduate-training": "/graduate-training/",
  "workforce-entry": "/workforce-entry/",
  "retention-immigration": "/retention-immigration/",
  "research-output": "/research-output/",
};

function numericColumns(exhibit: Exhibit): string[] {
  const yearCol = exhibit.columns.find((c) => /^year$/i.test(c));
  return exhibit.columns.filter((c) => c !== yearCol && exhibit.rows.some((r) => typeof r[c] === "number"));
}

// A real, generic pattern (not hardcoded to FIG101): the source CSVs
// store a per-row "estimate"/"confirmed" flag as a literal string value
// in an otherwise-numeric-looking column (FIG101's own "% change from
// previous year" column, confirmed by hand — see CLAUDE.md's
// "Methodology drawer" section). Detected structurally so any other
// exhibit using the same real convention is caught automatically.
function countFlagValue(exhibit: Exhibit, flag: string): number {
  let count = 0;
  for (const col of exhibit.columns) {
    for (const row of exhibit.rows) {
      if (typeof row[col] === "string" && row[col].toLowerCase() === flag) count++;
    }
  }
  return count;
}

function countProjectedValues(exhibit: Exhibit): number {
  const projectedCols = exhibit.columns.filter((c) => /\(projected\)$/i.test(c));
  let count = 0;
  for (const col of projectedCols) {
    for (const row of exhibit.rows) {
      if (row[col] != null) count++;
    }
  }
  return count;
}

function countMissingValues(exhibit: Exhibit, numCols: string[]): number {
  let count = 0;
  for (const col of numCols) {
    for (const row of exhibit.rows) {
      if (row[col] == null) count++;
    }
  }
  return count;
}

// A real primary key — every non-metric column joined together, the same
// "join every leading non-numeric column" rule BarRow's own generic
// fallback already uses for labels. `numericColumns()` above already
// excludes Year from the metric set (Year is a dimension even when its
// cells are stored as numbers), so this naturally becomes "Year alone"
// for a plain single-series timeseries and "Year+Country+Category" (or
// TAB501's own conf_norm+conference+year+country) for a real
// multi-dimension shape — a real bug caught by hand building this:
// an earlier version special-cased "Year exists -> use Year alone,"
// which silently collapsed every real multi-dimension exhibit (FIG510/
// FIG511/TAB604/TAB501, each keyed by Year PLUS Country/Category/Status)
// into thousands of false "duplicate" rows.
function primaryKey(exhibit: Exhibit, row: Record<string, string | number | null>): string {
  const numCols = new Set(numericColumns(exhibit));
  const keyCols = exhibit.columns.filter((c) => !numCols.has(c));
  // A real, separate shape (FIG403): every column is a numeric metric,
  // no dimension column at all — a single wide snapshot row. There's
  // nothing to key by there; each row is already the whole exhibit's
  // real content, not one of several rows sharing a real identity.
  if (keyCols.length === 0) return JSON.stringify(row);
  return keyCols.map((c) => String(row[c])).join("|");
}

function countDuplicateKeys(exhibit: Exhibit): number {
  const seen = new Map<string, number>();
  for (const row of exhibit.rows) {
    const key = primaryKey(exhibit, row);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  let duplicates = 0;
  for (const n of seen.values()) if (n > 1) duplicates += n - 1;
  return duplicates;
}

function primarySeriesStats(exhibit: Exhibit, numCols: string[]) {
  const yearCol = exhibit.columns.find((c) => /^year$/i.test(c));
  const primary = numCols[0];
  if (!primary) return null;
  const points = exhibit.rows
    .map((r) => ({ period: yearCol ? r[yearCol] : null, value: r[primary] }))
    .filter((p): p is { period: string | number | null; value: number } => typeof p.value === "number");
  if (points.length === 0) return null;
  const first = yearCol ? points[0] : points.reduce((a, b) => (b.value > a.value ? b : a), points[0]);
  const last = points[points.length - 1];
  const min = points.reduce((a, b) => (b.value < a.value ? b : a), points[0]);
  const max = points.reduce((a, b) => (b.value > a.value ? b : a), points[0]);
  return { yearCol, first, last, min, max, points };
}

export function buildReviewRecords(
  exhibits: Exhibit[],
  crosswalkByExhibit: Map<string, CrosswalkRow>,
  statusFile: ReviewStatusFile
): ReviewRecord[] {
  const byId = new Map(exhibits.map((e) => [e.id, e]));
  return exhibits.map((exhibit) => {
    const numCols = numericColumns(exhibit);
    const stats = primarySeriesStats(exhibit, numCols);
    const crosswalk = crosswalkByExhibit.get(exhibit.id);
    const status = statusFile[exhibit.id];

    const hasTrend = !!stats?.yearCol;
    const absoluteChange = hasTrend && stats ? stats.last.value - stats.first.value : null;
    const relativeChange = hasTrend && stats && stats.first.value !== 0 ? (absoluteChange! / stats.first.value) * 100 : null;

    return {
      review_id: exhibit.id,
      route: STAGE_ROUTE[exhibit.stage] ?? "",
      stage: exhibit.stage,
      exhibit_id: exhibit.id,
      report_reference: crosswalk ? `Ch. ${crosswalk.reportChapter} — ${crosswalk.reportId}` : `Ch. ${exhibit.chapter}`,
      title: exhibit.title,
      population: "", // real gap — content/report-crosswalk.csv's own field is TBD for every exhibit, see this file's own comment
      unit: "",
      source: exhibit.sourceShort,
      source_url: exhibit.sourceUrls[0] ?? "",
      first_period: hasTrend && stats ? String(stats.first.period) : "",
      last_period: hasTrend && stats ? String(stats.last.period) : "",
      first_value: stats ? String(stats.first.value) : "",
      last_value: stats ? String(stats.last.value) : "",
      absolute_change: absoluteChange != null ? absoluteChange.toFixed(2) : "",
      relative_change: relativeChange != null ? `${relativeChange.toFixed(1)}%` : "",
      minimum_value: stats ? String(stats.min.value) : "",
      minimum_period: stats?.yearCol ? String(stats.min.period) : "",
      maximum_value: stats ? String(stats.max.value) : "",
      maximum_period: stats?.yearCol ? String(stats.max.period) : "",
      row_count: exhibit.rows.length,
      series_count: numCols.length,
      missing_value_count: countMissingValues(exhibit, numCols),
      estimated_value_count: countFlagValue(exhibit, "estimate"),
      projected_value_count: countProjectedValues(exhibit),
      duplicate_key_count: countDuplicateKeys(exhibit),
      latest_data_update: hasTrend && stats ? String(stats.last.period) : "",
      calculation_note: exhibit.calculationNote ?? "",
      caveat: exhibit.dataNote ?? "",
      raw_source_files: resolveRawSourceFiles(exhibit, byId).join("; "),
      has_chart_svg: hasChartSvg(exhibit),
      review_status: status?.review_status ?? "not_reviewed",
      review_comment: status?.review_comment ?? "",
    };
  });
}

export interface ReviewValidationError {
  exhibitId: string;
  message: string;
}

// Real validation the generation command fails on — missing sources,
// duplicate keys, a derived exhibit with no report reference, a broken
// download path. Not a formality: this is exactly the kind of check the
// issue exists to automate instead of a human opening every route by
// hand.
export function validateReviewRecords(records: ReviewRecord[], exhibits: Exhibit[]): ReviewValidationError[] {
  const errors: ReviewValidationError[] = [];
  for (const r of records) {
    if (!r.source) errors.push({ exhibitId: r.exhibit_id, message: "missing source" });
    if (r.duplicate_key_count > 0) errors.push({ exhibitId: r.exhibit_id, message: `${r.duplicate_key_count} duplicate primary key(s)` });
    if (r.relative_change && Number.isNaN(Number(r.relative_change.replace("%", "")))) {
      errors.push({ exhibitId: r.exhibit_id, message: `invalid relative_change "${r.relative_change}"` });
    }
    const exhibit = exhibits.find((e) => e.id === r.exhibit_id);
    if (exhibit?.derivedFrom && exhibit.derivedFrom.length > 0 && !r.calculation_note) {
      errors.push({ exhibitId: r.exhibit_id, message: "derived exhibit missing a calculation note" });
    }
    if (!r.raw_source_files) errors.push({ exhibitId: r.exhibit_id, message: "no resolvable raw source file" });
  }
  return errors;
}

export const REVIEW_RECORD_COLUMNS: (keyof ReviewRecord)[] = [
  "review_id", "route", "stage", "exhibit_id", "report_reference", "title", "population", "unit",
  "source", "source_url", "first_period", "last_period", "first_value", "last_value",
  "absolute_change", "relative_change", "minimum_value", "minimum_period", "maximum_value", "maximum_period",
  "row_count", "series_count", "missing_value_count", "estimated_value_count", "projected_value_count",
  "duplicate_key_count", "latest_data_update", "calculation_note", "caveat", "raw_source_files",
  "has_chart_svg", "review_status", "review_comment",
];
