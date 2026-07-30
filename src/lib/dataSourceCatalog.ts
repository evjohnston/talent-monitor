import type { Exhibit } from "./types.ts";

export interface DataSourceEntry {
  organization: string;
  datasets: string[]; // each exhibit's own real sourceShort citing this org
  exhibitIds: string[];
  urls: string[];
}

// Splits a real sourceShort string on its first TOP-LEVEL comma (depth 0,
// not inside parentheses) to pull out the citing organization — plain
// "split on first comma" breaks on the one real multi-source citation
// that has a comma inside parens before its real delimiter ("IPO
// Association (2005, 2015), Harrity & Harrity...").
function leadingOrganization(sourceShort: string): string {
  let depth = 0;
  for (let i = 0; i < sourceShort.length; i++) {
    const c = sourceShort[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) return sourceShort.slice(0, i).trim();
  }
  return sourceShort.replace(/\.$/, "").trim();
}

// Real, confirmed data-source catalog for the /methodology/ route's own
// "data-source catalog" section — built from every exhibit's own real
// sourceShort/sourceUrls, not a hand-authored second copy of the same
// citation list. Grouped by citing organization (43 distinct sourceShort
// strings across 91 exhibits, checked by hand 2026-07-30) — a real,
// confirmed source-data inconsistency (USCIS's H-1B Employer Data Hub
// citation appears both with and without a trailing period across two
// exhibits) is normalized here at read time, not "fixed" in the report's
// own titles_and_sources.csv, which stays untouched as real committed
// source data.
export function buildDataSourceCatalog(exhibits: Exhibit[]): DataSourceEntry[] {
  const byOrg = new Map<string, DataSourceEntry>();
  for (const e of exhibits) {
    const org = leadingOrganization(e.sourceShort);
    if (!byOrg.has(org)) byOrg.set(org, { organization: org, datasets: [], exhibitIds: [], urls: [] });
    const entry = byOrg.get(org)!;
    const dataset = e.sourceShort.replace(/\.$/, "");
    if (!entry.datasets.includes(dataset)) entry.datasets.push(dataset);
    entry.exhibitIds.push(e.id);
    for (const u of e.sourceUrls) if (!entry.urls.includes(u)) entry.urls.push(u);
  }
  return [...byOrg.values()].sort((a, b) => a.organization.localeCompare(b.organization));
}
