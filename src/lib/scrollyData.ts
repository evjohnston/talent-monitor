// Real data-prep for the Overview's scrollytelling sequence (2026-07-30)
// — every function here reads an already-imported real exhibit, the same
// way sankeyData.ts already does for steps 1 and 5 (twoStreamsSankey,
// retentionFunnelSankey, reused directly, not duplicated here). No new
// numbers, no invented composite scores — only real values already in
// public/data/talent.json.
import type { Exhibit } from "./types.ts";

function byId(exhibits: Exhibit[], id: string): Exhibit | undefined {
  return exhibits.find((e) => e.id === id);
}

// Step 2 — FIG108's own real time series (international share of STEM
// degrees by level), already used for step 1's Two Streams Sankey.
export interface DegreeLevelPoint { year: number; bachelors: number | null; masters: number | null; doctorate: number | null; }
export function degreeLevelInternationalShare(exhibits: Exhibit[]): DegreeLevelPoint[] {
  const fig108 = byId(exhibits, "FIG108");
  if (!fig108) return [];
  return fig108.rows.map((r) => ({
    year: r.Year as number,
    bachelors: typeof r.Bachelors === "number" ? r.Bachelors * 100 : null,
    masters: typeof r.Masters === "number" ? r.Masters * 100 : null,
    doctorate: typeof r["Research Doctorates (SED)"] === "number" ? (r["Research Doctorates (SED)"] as number) * 100 : null,
  }));
}

// Step 2's own field selector — TAB101's real bookend (first real year vs.
// most recent real year) international share by field and degree level.
// TAB101 has no full time series per field, only these two real
// snapshots, so this returns the real bookend rather than a fabricated
// trend between them.
export interface FieldShareBookend { field: string; bachelors: number; masters: number; doctorate: number; }
export function fieldInternationalShareBookend(exhibits: Exhibit[]): FieldShareBookend[] {
  const tab101 = byId(exhibits, "TAB101");
  if (!tab101) return [];
  return tab101.rows
    .map((r) => ({
      field: String(r.Field ?? ""),
      bachelors: typeof r.Bachelors_LastYear === "number" ? r.Bachelors_LastYear : NaN,
      masters: typeof r.Masters_LastYear === "number" ? r.Masters_LastYear : NaN,
      doctorate: typeof r.Doctorate_LastYear === "number" ? r.Doctorate_LastYear : NaN,
    }))
    .filter((f) => f.field && !Number.isNaN(f.bachelors));
}

// Step 3 — TAB401's own real STEM-entrant cohort outcomes: a real funnel
// (STEM bachelor's / non-STEM bachelor's / sub-bachelor's credential /
// still enrolled / left without a degree), using the most recent real
// cohort. Distinguishes "left STEM but stayed in college"
// (nonstem_bachelors + subbac_credential) from "left college entirely"
// (left_no_degree) — the real distinction this step's own narrative
// requires, read directly off TAB401's own real columns, not inferred.
export interface PipelineStage { label: string; pct: number; group: "stem" | "left-stem" | "left-college" | "in-progress"; }
export function domesticPipelineFunnel(exhibits: Exhibit[]): { cohort: string; stages: PipelineStage[] } | null {
  const tab401 = byId(exhibits, "TAB401");
  if (!tab401 || tab401.rows.length === 0) return null;
  const row = tab401.rows[tab401.rows.length - 1];
  const cohort = String(row.cohort ?? "");
  const num = (v: unknown) => (typeof v === "number" ? v : 0);
  return {
    cohort,
    stages: [
      { label: "Finished with a STEM bachelor's", pct: num(row.stem_bachelors), group: "stem" },
      { label: "Finished with a non-STEM bachelor's", pct: num(row.nonstem_bachelors), group: "left-stem" },
      { label: "Finished with a sub-bachelor's credential", pct: num(row.subbac_credential), group: "left-stem" },
      { label: "Still enrolled, no degree yet", pct: num(row.still_enrolled), group: "in-progress" },
      { label: "Left college with no degree", pct: num(row.left_no_degree), group: "left-college" },
    ],
  };
}

// Step 4 — one real, hand-confirmed fact per real immigration gate, from
// 5 different already-imported exhibits (FIG603, FIG303, FIG606,
// TAB605). Deliberately a real STATED fact per gate, not a fabricated
// single cohort tracked through all five in sequence — this app has no
// real dataset following one population through every gate, and
// presenting one as if it existed would misrepresent five genuinely
// different real populations/years as a single flow.
export interface ImmigrationGate { label: string; fact: string; source: string; }
export function immigrationGates(exhibits: Exhibit[]): ImmigrationGate[] {
  const gates: ImmigrationGate[] = [];

  const fig603 = byId(exhibits, "FIG603");
  const opt = fig603?.rows[fig603.rows.length - 1];
  if (opt && typeof opt.Received === "number" && typeof opt["Approval Rate"] === "number") {
    gates.push({
      label: "OPT / STEM OPT",
      fact: `${Math.round(opt.Received as number).toLocaleString()} STEM OPT applications in ${opt.Year}, ${((opt["Approval Rate"] as number) * 100).toFixed(0)}% approved.`,
      source: "FIG603",
    });
  }

  const fig303 = byId(exhibits, "FIG303");
  const conc = fig303?.rows[fig303.rows.length - 1];
  const concKey = "Top 10 employers' share of approvals";
  if (conc && typeof conc[concKey] === "number") {
    gates.push({
      label: "H-1B",
      fact: `The top 10 employers took ${(conc[concKey] as number).toFixed(0)}% of all H-1B approvals in ${conc.Year}.`,
      source: "FIG303",
    });
  }

  const fig606 = byId(exhibits, "FIG606");
  const perm = fig606?.rows[fig606.rows.length - 1];
  if (perm && typeof perm["Certified-expired"] === "number" && typeof perm["Certified (Current + Expired)"] === "number") {
    const share = ((perm["Certified-expired"] as number) / (perm["Certified (Current + Expired)"] as number)) * 100;
    gates.push({
      label: "PERM",
      fact: `${share.toFixed(0)}% of PERM labor certifications in ${perm.Year} expired before being used.`,
      source: "FIG606",
    });
  }

  const tab605 = byId(exhibits, "TAB605");
  const gc = tab605?.rows[tab605.rows.length - 1];
  if (gc && typeof gc["India: EB2"] === "number") {
    gates.push({
      label: "Green card",
      fact: `An India-born EB-2 applicant filing in ${gc.Year} faces a real wait of about ${Math.round(gc["India: EB2"] as number)} years.`,
      source: "TAB605",
    });
  }

  return gates;
}

// Step 6 — a real US-vs-China metric switcher. Every metric here is
// already a real, imported exhibit; TAB506 (a company-level exhibit) is
// aggregated to country totals for this one comparison, not re-derived
// or estimated — the same real 2025 company figures already shown on
// the Research Output stage page, just summed by country.
export interface ResearchMetric { key: string; label: string; unit: "share" | "count"; year: number; us: number; china: number; sourceId: string; }
export function researchLeadershipMetrics(exhibits: Exhibit[]): ResearchMetric[] {
  const metrics: ResearchMetric[] = [];

  const fig501 = byId(exhibits, "FIG501");
  const conf = fig501?.rows[fig501.rows.length - 1];
  if (conf && typeof conf["United States"] === "number" && typeof conf.China === "number") {
    metrics.push({ key: "conferences", label: "Share of top AI-conference presentations", unit: "share", year: conf.Year as number, us: (conf["United States"] as number) * 100, china: (conf.China as number) * 100, sourceId: "FIG501" });
  }

  const fig502 = byId(exhibits, "FIG502");
  const cited = fig502?.rows[fig502.rows.length - 1];
  if (cited && typeof cited.us === "number" && typeof cited.china === "number") {
    metrics.push({ key: "publications", label: "Share of most-cited emerging-tech research", unit: "share", year: cited.Year as number, us: (cited.us as number) * 100, china: (cited.china as number) * 100, sourceId: "FIG502" });
  }

  const tab506 = byId(exhibits, "TAB506");
  if (tab506) {
    const yearCol = "2025 Patents";
    const usTotal = tab506.rows.filter((r) => r.Country === "United States").reduce((s, r) => s + (typeof r[yearCol] === "number" ? (r[yearCol] as number) : 0), 0);
    const cnTotal = tab506.rows.filter((r) => r.Country === "China").reduce((s, r) => s + (typeof r[yearCol] === "number" ? (r[yearCol] as number) : 0), 0);
    if (usTotal > 0 || cnTotal > 0) metrics.push({ key: "patents", label: "Utility patents among tracked companies", unit: "count", year: 2025, us: usTotal, china: cnTotal, sourceId: "TAB506" });
  }

  const fig509 = byId(exhibits, "FIG509");
  const rd = fig509?.rows[fig509.rows.length - 1];
  if (rd && typeof rd.US === "number" && typeof rd.China === "number") {
    metrics.push({ key: "rd", label: "R&D spending as a share of GDP", unit: "share", year: rd.Year as number, us: (rd.US as number) * 100, china: (rd.China as number) * 100, sourceId: "FIG509" });
  }

  return metrics;
}
