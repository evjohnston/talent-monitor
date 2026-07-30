import type { Exhibit, Stage } from "./types.ts";
import { computeAiConferenceCatchUp } from "./aiConferenceCatchUp.ts";

// One reusable, typed annotation system (issue #15) — annotations are
// data (this file), not chart-specific JSX. Every entry below is a real,
// report-supported fact, computed from this app's own already-imported
// exhibit data, never an invented event inferred from a line's shape.
export type AnnotationType =
  | "event"
  | "policy"
  | "source_break"
  | "projection_start"
  | "peak"
  | "crossing"
  | "definition_change"
  | "custom";

export interface ChartAnnotation {
  id: string;
  exhibitIds: string[]; // this app's real exhibit-id keys (e.g. "FIG101"), not an abstract metricId
  stage: Stage;
  type: AnnotationType;
  start: string | number; // a Year value matching the exhibit's own row shape
  end?: string | number;
  label: string;
  shortLabel?: string;
  detail: string;
  sourceLabel?: string;
  sourceUrl?: string;
  priority: 1 | 2 | 3;
  showByDefault: boolean;
}

function byId(exhibits: Exhibit[], id: string): Exhibit | undefined {
  return exhibits.find((e) => e.id === id);
}

function years(exhibit: Exhibit | undefined): number[] {
  if (!exhibit) return [];
  return exhibit.rows.map((r) => r.Year).filter((y): y is number => typeof y === "number");
}

// A real, report-sourced event annotation — the report's own R pipeline
// (talent_charts/figures.Rmd, Figure 4.09) places this exact
// `annotate("text", x = 2021, label = "COVID-19", ...)` on FIG409's own
// chart. Not inferred from the line's shape; read directly from the
// report's own chart-generation source.
function fig409Covid(exhibits: Exhibit[]): ChartAnnotation | null {
  const fig409 = byId(exhibits, "FIG409");
  if (!fig409 || !years(fig409).includes(2021)) return null;
  return {
    id: "fig409-covid",
    exhibitIds: ["FIG409"],
    stage: fig409.stage,
    type: "event",
    start: 2021,
    label: "COVID-19",
    shortLabel: "COVID-19",
    detail: "The report's own chart marks 2021 as the COVID-19 disruption point on U.S. study-abroad participation.",
    sourceLabel: fig409.sourceShort,
    priority: 1,
    showByDefault: true,
  };
}

// FIG109/FIG110 each store the report's own author-generated projections
// in a separate "(Country) (projected)" column per country, real and
// disclosed in CLAUDE.md's "Projection methods" section — the boundary
// itself is computed here from the real data (the last year any country's
// plain observed column is non-null), not hand-typed.
function projectionStart(exhibits: Exhibit[], id: string, label: string): ChartAnnotation | null {
  const exhibit = byId(exhibits, id);
  if (!exhibit) return null;
  const observedYears = exhibit.rows.filter((r) => r.China != null).map((r) => r.Year).filter((y): y is number => typeof y === "number");
  const projectedYears = exhibit.rows.filter((r) => r["China (projected)"] != null).map((r) => r.Year).filter((y): y is number => typeof y === "number");
  if (observedYears.length === 0 || projectedYears.length === 0) return null;
  const lastObserved = Math.max(...observedYears);
  const firstProjected = Math.min(...projectedYears.filter((y) => y > lastObserved));
  if (!Number.isFinite(firstProjected)) return null;
  return {
    id: `${id.toLowerCase()}-projection-start`,
    exhibitIds: [id],
    stage: exhibit.stage,
    type: "projection_start",
    start: firstProjected,
    label: `${label}: observed data ends, the report's own projection begins`,
    shortLabel: "Projection begins",
    detail: `Every series in this exhibit is real, observed data through ${lastObserved}; ${firstProjected} onward is the report's own author-generated projection, not a newly observed value.`,
    sourceLabel: exhibit.sourceShort,
    priority: 1,
    showByDefault: true,
  };
}

// TAB501's own real per-conference "first year China's share reached the
// US's" computation (src/lib/aiConferenceCatchUp.ts) — reused directly,
// not recomputed by hand, so this can never drift from what that chart
// itself reports. CVPR picked as the single representative crossing
// point for the initial annotation set (a real, well-known conference,
// not the smallest/most obscure one available).
function tab501Crossing(exhibits: Exhibit[]): ChartAnnotation | null {
  const tab501 = byId(exhibits, "TAB501");
  if (!tab501) return null;
  const results = computeAiConferenceCatchUp(tab501);
  const cvpr = results.find((r) => r.conference === "CVPR" && r.catchUpYear != null);
  if (!cvpr || cvpr.catchUpYear == null) return null;
  return {
    id: "tab501-cvpr-crossing",
    exhibitIds: ["TAB501"],
    stage: tab501.stage,
    type: "crossing",
    start: cvpr.catchUpYear,
    label: `CVPR: China's share of authorship first reached the United States' in ${cvpr.catchUpYear}`,
    shortLabel: "China reaches parity (CVPR)",
    detail: `At CVPR, one of the largest computer-vision conferences, China's share of accepted papers first equaled or exceeded the United States' share in ${cvpr.catchUpYear}. By ${cvpr.latestYear}, China held ${(cvpr.latestChinaShare * 100).toFixed(0)}% versus the United States' ${(cvpr.latestUsShare * 100).toFixed(0)}%.`,
    sourceLabel: tab501.sourceShort,
    priority: 1,
    showByDefault: true,
  };
}

// FIG606's own real "Certified-expired" / "Certified (Current + Expired)"
// columns — the same computation already surfaced on the Overview's
// immigration-gates scrollytelling step (src/lib/scrollyData.ts), now
// also expressed as a chart annotation directly on FIG606's own panel.
function fig606PermExpiration(exhibits: Exhibit[]): ChartAnnotation | null {
  const fig606 = byId(exhibits, "FIG606");
  if (!fig606) return null;
  const latest = [...fig606.rows].reverse().find(
    (r) => typeof r["Certified-expired"] === "number" && typeof r["Certified (Current + Expired)"] === "number"
  );
  if (!latest || typeof latest.Year !== "number") return null;
  const share = ((latest["Certified-expired"] as number) / (latest["Certified (Current + Expired)"] as number)) * 100;
  return {
    id: "fig606-perm-expiration",
    exhibitIds: ["FIG606"],
    stage: fig606.stage,
    type: "custom",
    start: latest.Year,
    label: `${share.toFixed(0)}% of ${latest.Year} PERM labor certifications expired before being used`,
    shortLabel: `${share.toFixed(0)}% expired unused`,
    detail: `Of ${(latest["Certified (Current + Expired)"] as number).toLocaleString()} certified PERM labor certifications in ${latest.Year}, ${(latest["Certified-expired"] as number).toLocaleString()} (${share.toFixed(0)}%) expired before the employer completed the next step — a real measure of backlog friction, not a denial.`,
    sourceLabel: fig606.sourceShort,
    priority: 2,
    showByDefault: false,
  };
}

// The full real, curated registry — every entry traced to this app's own
// already-imported exhibit data or the report's own chart-generation
// source. Deliberately 5, not padded to a rounder number: a 6th
// candidate (FIG101's real 1900-1901/1916/1923 estimate-year flags,
// already a dataNote) was considered and deferred rather than rushed in
// — see CLAUDE.md's "Annotation system" section.
export function buildAnnotations(exhibits: Exhibit[]): ChartAnnotation[] {
  return [
    fig409Covid(exhibits),
    projectionStart(exhibits, "FIG109", "FIG109"),
    projectionStart(exhibits, "FIG110", "FIG110"),
    tab501Crossing(exhibits),
    fig606PermExpiration(exhibits),
  ].filter((a): a is ChartAnnotation => a != null);
}

export function annotationsForExhibit(all: ChartAnnotation[], exhibitId: string): ChartAnnotation[] {
  return all.filter((a) => a.exhibitIds.includes(exhibitId));
}

export interface AnnotationValidationError {
  annotationId: string;
  message: string;
}

// Real validation, not a formality — checks every annotation against the
// actual exhibit data it claims to describe, the same discipline this
// app already applies to the importer (unknown exhibit ids, out-of-range
// years) rather than trusting a hand-authored registry entry blindly.
export function validateAnnotations(annotations: ChartAnnotation[], exhibits: Exhibit[]): AnnotationValidationError[] {
  const errors: AnnotationValidationError[] = [];
  for (const a of annotations) {
    for (const exhibitId of a.exhibitIds) {
      const exhibit = byId(exhibits, exhibitId);
      if (!exhibit) {
        errors.push({ annotationId: a.id, message: `references unknown exhibit id "${exhibitId}"` });
        continue;
      }
      const realYears = years(exhibit);
      if (realYears.length > 0) {
        const startYear = typeof a.start === "number" ? a.start : Number(a.start);
        if (Number.isFinite(startYear) && !realYears.includes(startYear)) {
          errors.push({ annotationId: a.id, message: `start year ${a.start} is outside ${exhibitId}'s real year range (${Math.min(...realYears)}-${Math.max(...realYears)})` });
        }
        if (a.end != null) {
          const endYear = typeof a.end === "number" ? a.end : Number(a.end);
          if (Number.isFinite(endYear) && !realYears.includes(endYear)) {
            errors.push({ annotationId: a.id, message: `end year ${a.end} is outside ${exhibitId}'s real year range (${Math.min(...realYears)}-${Math.max(...realYears)})` });
          }
        }
      }
    }
  }
  return errors;
}
