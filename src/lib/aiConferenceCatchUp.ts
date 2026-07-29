import type { Exhibit } from "./types.ts";

// TAB501 ("When Did China Catch Up at Each AI Conference?") is a real,
// genuinely unique shape in this app: one row per (conference, year,
// country) — 454 rows, 20 conferences, up to 39 years each, only China
// and the United States as real countries present. The generic
// ranked-bar fallback (toRankedBars in exhibitData.ts) flattens all 454
// rows and ranks by raw `share`, which produces a technically-correct
// but meaningless list — the same conference's own US-share values
// across many different years, sorted next to each other because
// they're numerically close, reading like "colt, colt, colt..." (real,
// confirmed: that's literally what the old rendering showed). Flagged in
// content/report-crosswalk.csv as needing "a real bespoke chart, not
// polish" — this is that chart's real data prep, same house pattern as
// sankeyData.ts's retentionFunnelSankey/twoStreamsSankey (a genuinely
// unique exhibit shape gets its own derivation, not a generic-fallback
// special case, per CLAUDE.md's "How to extend" — FIG303's buildFig303
// is what a justified one-off looks like).
export interface ConferenceCatchUp {
  conference: string; // real acronym, e.g. "CVPR" — conf_norm uppercased
  // First real year China's share >= the US's share, or null if China
  // never reaches the US's share anywhere in the exhibit's own real year
  // range for this conference (a real, honest "not yet," not a guess).
  catchUpYear: number | null;
  latestYear: number;
  latestChinaShare: number;
  latestUsShare: number;
}

export function computeAiConferenceCatchUp(exhibit: Exhibit): ConferenceCatchUp[] {
  const byConf = new Map<string, Map<number, { china?: number; us?: number }>>();
  for (const r of exhibit.rows) {
    const conf = r.conf_norm;
    const year = r.year;
    const country = r.country;
    const share = r.share;
    if (typeof conf !== "string" || typeof year !== "number" || typeof share !== "number") continue;
    if (country !== "China" && country !== "United States") continue;
    if (!byConf.has(conf)) byConf.set(conf, new Map());
    const byYear = byConf.get(conf)!;
    if (!byYear.has(year)) byYear.set(year, {});
    const entry = byYear.get(year)!;
    if (country === "China") entry.china = share;
    else entry.us = share;
  }

  const results: ConferenceCatchUp[] = [];
  for (const [conf, byYear] of byConf) {
    const years = [...byYear.keys()].sort((a, b) => a - b);
    let catchUpYear: number | null = null;
    for (const y of years) {
      const { china, us } = byYear.get(y)!;
      if (china != null && us != null && china >= us) { catchUpYear = y; break; }
    }
    const latestYear = years[years.length - 1];
    const latest = byYear.get(latestYear)!;
    if (latest.china == null || latest.us == null) continue; // real but incomplete final year — skip rather than show a half-real row
    results.push({
      conference: conf.toUpperCase(),
      catchUpYear,
      latestYear,
      latestChinaShare: latest.china,
      latestUsShare: latest.us,
    });
  }

  // Real catch-ups first, earliest catch-up first (the report's own
  // question is "when," so ordering by when is the direct answer); "not
  // yet" conferences last, ranked by how close China is to catching up
  // (closest gap first) rather than left in an arbitrary order.
  return results.sort((a, b) => {
    if (a.catchUpYear != null && b.catchUpYear != null) return a.catchUpYear - b.catchUpYear;
    if (a.catchUpYear != null) return -1;
    if (b.catchUpYear != null) return 1;
    return (b.latestChinaShare - b.latestUsShare) - (a.latestChinaShare - a.latestUsShare);
  });
}
