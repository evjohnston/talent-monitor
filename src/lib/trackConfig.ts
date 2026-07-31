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
  foundation: {
    heroId: "FIG401",
    sections: [
      { title: "How US students compare internationally", ids: ["FIG402", "FIG403", "FIG404"] },
      { title: "The STEM completion path", ids: ["FIG406", "TAB401", "FIG407", "TAB402", "FIG408"] },
      { title: "Study abroad", ids: ["FIG409", "FIG410", "FIG411", "TAB403", "TAB404"] },
    ],
  },
  "degree-production": {
    heroId: "FIG101",
    sections: [
      { title: "The shape of American degree production", ids: ["FIG102", "FIG103", "FIG104", "FIG105"] },
      { title: "How international is the pipeline", ids: ["FIG106", "FIG107", "FIG108", "TAB101"] },
      { title: "Who's ahead globally", ids: ["FIG109", "FIG110"] },
    ],
  },
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
  "workforce-entry": {
    heroId: "FIG303",
    sections: [
      { title: "Who actually works in STEM after training", ids: ["FIG301", "TAB301"] },
      { title: "The H-1B employer landscape, in more detail", ids: ["FIG302", "TAB302"] },
      { title: "AI-company founders and staffing", ids: ["FIG304", "FIG305", "FIG306", "FIG307", "FIG308"] },
    ],
  },
  // No heroId here — retention-immigration's own real hero is a custom
  // Sankey (RetentionFunnelHero.tsx), not a plain exhibit, computed from
  // FIG601/FIG602 directly. excludeIds still applies: those two exhibits
  // feed the hero's own numbers and would otherwise duplicate as their
  // own standalone panels.
  "retention-immigration": {
    excludeIds: ["FIG601", "FIG602"],
    sections: [
      { title: "What happens right after the PhD: the work-authorization pipeline", ids: ["FIG603", "FIG604", "FIG605"] },
      { title: "Employer-side friction: the PERM backlog", ids: ["FIG606", "TAB604"] },
      { title: "Who's declining to stay, and where they go instead", ids: ["FIG607", "TAB601", "TAB602"] },
      { title: "Why it matters", ids: ["FIG608", "FIG609"] },
    ],
  },
  "research-output": {
    heroId: "TAB506",
    sections: [
      { title: "Who leads in cited and frontier research", ids: ["FIG501", "FIG502", "FIG503", "FIG504", "TAB501"] },
      { title: "Prizes, laureates, and academic prestige", ids: ["FIG505", "FIG506", "FIG507", "TAB502"] },
      { title: "R&D investment", ids: ["FIG508", "FIG509", "FIG510", "FIG511"] },
      { title: "Research impact and patents", ids: ["FIG512", "FIG513", "TAB505-a", "TAB505-b", "TAB505-c"] },
    ],
  },
};
