// Extracted from scripts/import-talent-charts.ts (2026-07-30) — pure data,
// no fs/DOM dependency, safe to import from either the Node-context
// importer or an Astro-context page (e.g. the /downloads/ route's own
// raw-source-file resolver, src/lib/rawSourceFiles.ts). Re-exported from
// the importer so its own behavior is unchanged.
//
// Some exhibits' underlying CSV was exported in named slices
// (talent_charts/figures.Rmd / tables.Rmd's own `sources =` lists give
// the real per-part label) rather than one file per fig_no. Two shapes:
// "split" (each part becomes its own exhibit, same shape but a different
// population — e.g. one table per STEM field) and "merge" (parts share
// the same Year axis, columns get prefixed with the part label and
// folded into one exhibit).
export type PartsMode = "split" | "merge";
export interface PartsSpec { mode: PartsMode; parts: { suffix: string; label: string }[] }

export const PARTS: Record<string, PartsSpec> = {
  FIG301: { mode: "merge", parts: [{ suffix: "a", label: "U.S.-born" }, { suffix: "b", label: "Foreign-born" }] },
  FIG604: { mode: "merge", parts: [{ suffix: "a", label: "All industries" }, { suffix: "b", label: "Tech sector" }] },
  FIG605: { mode: "merge", parts: [{ suffix: "a", label: "All industries" }, { suffix: "b", label: "Tech sector" }] },
  TAB202: {
    mode: "split",
    parts: [
      { suffix: "a", label: "Engineering" },
      { suffix: "b", label: "Math and Computer Science" },
      { suffix: "c", label: "Physical and Life Sciences" },
    ],
  },
  TAB203: {
    mode: "split",
    parts: [{ suffix: "a", label: "Science" }, { suffix: "b", label: "Engineering" }, { suffix: "c", label: "Health" }],
  },
  TAB204: {
    mode: "merge",
    parts: [{ suffix: "a", label: "U.S. citizens & permanent residents" }, { suffix: "b", label: "Temporary visa holders" }],
  },
  TAB505: {
    mode: "split",
    parts: [
      { suffix: "a", label: "Biotechnology" },
      { suffix: "b", label: "Semiconductors" },
      { suffix: "c", label: "Computer technology" },
    ],
  },
};
