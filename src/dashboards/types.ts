import type { Exhibit, Stage, StageNote } from "../lib/types.ts";
import type { ChartAnnotation } from "../lib/annotations.ts";

// One shared bundle every dashboard reads from — built once per page at
// build time (see lib/buildContext.ts) since each stage is now its own
// real Astro route rather than a client-side tab switch. Deliberately just
// data, no functions (`dashboard`/`navigate` used to live here) — a
// framework-component prop passed from an .astro page must serialize to
// JSON for hydration, and cross-page navigation is now a real <a href>,
// not client-side state.
//
// Only for pages that genuinely span every stage (Overview, Methodology,
// Downloads) — a real, confirmed hydration-payload issue (issue #23):
// the 6 single-stage Track pages used to receive this SAME full-corpus
// context too, despite TrackShell only ever reading ONE stage's own
// slice out of it, so every stage page shipped the whole real 91-exhibit
// corpus (twice — see the `data` field this type used to carry, a second
// full copy of the same exhibits array, dropped entirely below since
// nothing but a single date string ever needed it) to its own hydration
// payload regardless of how many exhibits that page actually rendered.
// See TrackDashboardContext below for what a single-stage page uses now.
export interface DashboardContext {
  generatedAt: string | null;
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

// A single Track page's own real slice — TrackShell.tsx and the 6
// Track*.tsx files never read anything outside one stage's own exhibits/
// note (confirmed by hand, not assumed: TrackRetentionImmigration's own
// extra Sankey only ever looks up FIG601/FIG602 by id, both already
// within its own stage's slice), so this is genuinely all a Track page
// needs — see buildTrackContext() in buildContext.ts.
export interface TrackDashboardContext {
  stage: Stage;
  exhibits: Exhibit[]; // just this stage's own real exhibits, in report order
  note: StageNote | undefined;
  annotations: ChartAnnotation[]; // real annotations for this stage's own exhibits only
}
