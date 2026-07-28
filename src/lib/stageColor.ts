import type { Stage } from "./types.ts";

// One color per stage, for the news ticker's tag — reuses the same
// continent-color tokens SeriesChart.tsx repurposes for non-country series
// (see index.css) rather than spending a new part of the color budget.
// Deliberately never --red: that's the one brand accent, reserved (KPI
// highlight, primary buttons, the Overview hero) — a stage tag needs to be
// visually distinct from it, not compete with it.
export const STAGE_COLOR: Record<Stage, string> = {
  foundation: "var(--cont-na)",
  "degree-production": "var(--cont-eu)",
  "graduate-training": "var(--cont-sa)",
  "workforce-entry": "var(--cont-af)",
  "retention-immigration": "var(--cont-as)",
  "research-output": "var(--cont-oc)",
};
