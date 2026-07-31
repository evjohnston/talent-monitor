import type { Stage } from "./types.ts";
import type { TrackLayoutConfig } from "./trackLayout.ts";

// The same real, hand-authored hero/section configuration each
// Track*.tsx file used to hardcode inline in its own JSX — extracted as
// plain data so a stage's `.astro` page can compute its real layout
// directly (see trackLayout.ts's own note on why: `.astro`'s
// `client:visible` directive only applies to components mounted straight
// from a template, not nested inside a React component tree). Real
// content is unchanged from each Track*.tsx file's own original config;
// see git history on those files for the per-stage editorial reasoning
// already documented there.
//
// Filled in per stage as each one migrates to the per-panel-island
// architecture (issue #23's real TBT fix) — a stage not yet listed here
// still uses the original TrackShell.tsx path.
export const TRACK_CONFIG: Partial<Record<Stage, TrackLayoutConfig>> = {
  "graduate-training": {
    heroId: "FIG207",
    sections: [
      { title: "Postdoctoral and graduate training composition", ids: ["FIG208", "TAB203-a", "TAB203-b", "TAB203-c"] },
      { title: "How many international students are here, and at what level", ids: ["FIG201", "FIG202", "TAB204"] },
      { title: "Where they come from", ids: ["FIG203", "FIG204", "FIG206", "TAB201"] },
      { title: "What they study", ids: ["FIG205", "TAB202-a", "TAB202-b", "TAB202-c"] },
      { title: "The economics and outlook of international enrollment", ids: ["FIG209", "FIG210", "FIG211", "FIG212"] },
    ],
  },
};
