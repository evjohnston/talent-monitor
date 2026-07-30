import type { DataFile, Exhibit, Stage, StageNote } from "../lib/types.ts";
import type { ChartAnnotation } from "../lib/annotations.ts";

// One shared bundle every dashboard reads from — built once per page at
// build time (see lib/buildContext.ts) since each stage is now its own
// real Astro route rather than a client-side tab switch. Deliberately just
// data, no functions (`dashboard`/`navigate` used to live here) — a
// framework-component prop passed from an .astro page must serialize to
// JSON for hydration, and cross-page navigation is now a real <a href>,
// not client-side state.
export interface DashboardContext {
  data: DataFile | null;
  exhibits: Exhibit[]; // the full real corpus, unfiltered
  exhibitsByStage: Record<Stage, Exhibit[]>;
  latestNote: Partial<Record<Stage, StageNote>>;
  // Real, report-supported chart annotations (src/lib/annotations.ts),
  // built once here from the same full exhibit corpus every other field
  // on this context already reads — see ExhibitChart.tsx's own
  // annotationsForExhibit() for how a panel narrows this down to just
  // its own exhibit's entries.
  annotations: ChartAnnotation[];
}
