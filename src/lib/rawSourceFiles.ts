import type { Exhibit } from "./types.ts";
import { PARTS } from "./exhibitParts.ts";

// Resolves an exhibit back to the real raw CSV filename(s) it actually
// came from, in talent_charts/data/ — the file(s) this app's own importer
// read BEFORE any numeric coercion, merging, or derivation, for the
// "link to the raw files we used, not our own processed files" requirement
// (2026-07-30 direction: the Overview's "view all data" link and this
// route's own raw-download column should point here, not at exhibit.rows,
// which has already been through coerce()/numericColumns() etc.).
//
// Four real cases, matching scripts/import-talent-charts.ts's own real
// import logic exactly (not guessed at separately):
// 1. A derived exhibit (FIG303, TAB303, FIG405, TAB503, TAB504, TAB605) —
//    its own `derivedFrom` already names the real source exhibit(s); each
//    of those resolves in turn (one level deep in every real case today).
// 2. A SPLIT-mode multi-part exhibit (e.g. "TAB202-a") — the exhibit's own
//    id has the hyphenated suffix; the real raw file drops the hyphen
//    (TAB202a.csv), exactly as readExhibitCsv(`${id}${suffix}`) reads it.
// 3. A MERGE-mode multi-part exhibit (e.g. "FIG301") — every real part
//    file that got folded into it (FIG301a.csv, FIG301b.csv).
// 4. Everything else — a real, direct, one-file-per-exhibit case
//    (`${exhibit.id}.csv`).
export function resolveRawSourceFiles(exhibit: Exhibit, byId: Map<string, Exhibit>): string[] {
  if (exhibit.derivedFrom && exhibit.derivedFrom.length > 0) {
    const files = new Set<string>();
    for (const sourceId of exhibit.derivedFrom) {
      const sourceExhibit = byId.get(sourceId);
      const resolved = sourceExhibit ? resolveRawSourceFiles(sourceExhibit, byId) : [`${sourceId}.csv`];
      for (const f of resolved) files.add(f);
    }
    return [...files];
  }

  const splitMatch = exhibit.id.match(/^([A-Z]+\d+)-([a-z0-9]+)$/);
  if (splitMatch) {
    const [, base, suffix] = splitMatch;
    if (PARTS[base]?.mode === "split") return [`${base}${suffix}.csv`];
  }

  const mergeSpec = PARTS[exhibit.id];
  if (mergeSpec?.mode === "merge") {
    return mergeSpec.parts.map((p) => `${exhibit.id}${p.suffix}.csv`);
  }

  return [`${exhibit.id}.csv`];
}
