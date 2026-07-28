// Two real Sankey flows, each built from exhibit data already imported by
// scripts/import-talent-charts.ts — no new/unverified numbers. See
// CLAUDE.md and the report's own V3 chapters for the argument each one
// visualizes.
import type { Exhibit } from "./types.ts";
import type { SankeyLinkInput, SankeyNodeInput } from "../components/Sankey.tsx";

function latestRow(exhibit: Exhibit | undefined): Record<string, string | number | null> | null {
  return exhibit && exhibit.rows.length > 0 ? exhibit.rows[exhibit.rows.length - 1] : null;
}

// "Two Streams of Talent" (Ch1's own section title) — domestic vs.
// international share of STEM degrees, by degree level. FIG108's most
// recent row (2024): Bachelor's 6.2% international, Master's 51.0%,
// (SED) Doctorate 36.4% — the report's own "6 percent illusion": one
// aggregate hides three very different systems. Each degree LEVEL is its
// own real 100%, not weighted by real relative degree volume across
// levels — this diagram is about composition at each level, not about
// how many bachelor's vs. doctoral degrees exist.
export function twoStreamsSankey(exhibits: Exhibit[]): { nodes: SankeyNodeInput[]; links: SankeyLinkInput[]; year: number | string | null } {
  const fig108 = latestRow(exhibits.find((e) => e.id === "FIG108"));
  const bach = typeof fig108?.Bachelors === "number" ? fig108.Bachelors * 100 : null;
  const mast = typeof fig108?.Masters === "number" ? fig108.Masters * 100 : null;
  const doc = typeof fig108?.["Research Doctorates (SED)"] === "number" ? (fig108["Research Doctorates (SED)"] as number) * 100 : null;
  if (bach == null || mast == null || doc == null) return { nodes: [], links: [], year: null };

  const nodes: SankeyNodeInput[] = [
    { id: "domestic", label: "Domestic", color: "var(--country-us)" },
    { id: "intl", label: "International", color: "var(--red)" },
    { id: "bachelors", label: "Bachelor's" },
    { id: "masters", label: "Master's" },
    { id: "doctorate", label: "Doctorate" },
  ];
  const pct = (v: number) => `${v.toFixed(1)}% of that level's STEM graduates`;
  const links: SankeyLinkInput[] = [
    { source: "domestic", target: "bachelors", value: 100 - bach, detail: pct(100 - bach) },
    { source: "intl", target: "bachelors", value: bach, detail: pct(bach) },
    { source: "domestic", target: "masters", value: 100 - mast, detail: pct(100 - mast) },
    { source: "intl", target: "masters", value: mast, detail: pct(mast) },
    { source: "domestic", target: "doctorate", value: 100 - doc, detail: pct(100 - doc) },
    { source: "intl", target: "doctorate", value: doc, detail: pct(doc) },
  ];
  return { nodes, links, year: fig108?.Year ?? null };
}

// "The Retention Gap" (Ch6/Conclusion) — a real, sequential cohort funnel:
// FIG602's own 5-year and 10-year stay rates for the same population of
// international STEM PhD recipients, tracked over time (not conditioned on
// FIG601's separate "intent" survey — that's a different measure, on a
// different population snapshot, so it's surfaced as context above the
// diagram rather than chained into it as if it were the same flow).
export function retentionFunnelSankey(exhibits: Exhibit[]): { nodes: SankeyNodeInput[]; links: SankeyLinkInput[]; year: number | string | null; intendToStay: number | null } {
  const fig602 = latestRow(exhibits.find((e) => e.id === "FIG602"));
  const stay5 = typeof fig602?.["5-year stay rate"] === "number" ? fig602["5-year stay rate"] * 100 : null;
  const stay10 = typeof fig602?.["10-year stay rate"] === "number" ? fig602["10-year stay rate"] * 100 : null;
  const fig601 = latestRow(exhibits.find((e) => e.id === "FIG601"));
  const intendCol = "Percent of International PhD Recipients who reported they 'intended to stay' in the United States";
  const intendToStay = typeof fig601?.[intendCol] === "number" ? (fig601[intendCol] as number) * 100 : null;
  if (stay5 == null || stay10 == null) return { nodes: [], links: [], year: null, intendToStay };

  const left5 = 100 - stay5;
  const stay10OfStay5 = stay10; // stay10 is already measured against the full original cohort
  const left5to10 = stay5 - stay10;

  const nodes: SankeyNodeInput[] = [
    { id: "cohort", label: "International STEM PhDs", detail: "full cohort" },
    { id: "stay5", label: "In the U.S. at 5 years", detail: `${stay5.toFixed(1)}% of the cohort` },
    { id: "left5", label: "Left within 5 years", detail: `${left5.toFixed(1)}% of the cohort`, color: "var(--slate)" },
    { id: "stay10", label: "In the U.S. at 10 years", detail: `${stay10.toFixed(1)}% of the cohort` },
    { id: "left10", label: "Left between 5-10 years", detail: `${left5to10.toFixed(1)}% of the cohort`, color: "var(--slate)" },
  ];
  const links: SankeyLinkInput[] = [
    { source: "cohort", target: "stay5", value: stay5, detail: `${stay5.toFixed(1)}% remained in the U.S. through year 5` },
    { source: "cohort", target: "left5", value: left5, detail: `${left5.toFixed(1)}% had left within 5 years` },
    { source: "stay5", target: "stay10", value: stay10OfStay5, detail: `${stay10.toFixed(1)}% of the original cohort remained through year 10` },
    { source: "stay5", target: "left10", value: left5to10, detail: `${left5to10.toFixed(1)}% of the original cohort left between years 5 and 10` },
  ];
  return { nodes, links, year: fig602?.Year ?? null, intendToStay };
}
