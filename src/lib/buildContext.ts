import type { DataFile, Exhibit, Stage, StageNote } from "./types.ts";
import { STAGES } from "./types.ts";
import type { DashboardContext, TrackDashboardContext } from "../dashboards/types.ts";
import { buildAnnotations } from "./annotations.ts";

// Built once per page, at build time (each .astro page imports
// public/data/talent.json directly and calls this) — the same
// exhibitsByStage/latestNote grouping App.tsx used to compute client-side
// in a useMemo, moved here so both a static Astro page and the React
// islands it mounts read from one real implementation.
//
// Only for pages that genuinely need every stage's own data (Overview,
// Methodology, Downloads) — see buildTrackContext() below for the single-
// stage Track pages, which never needed this full a corpus in the first
// place (issue #23's own real hydration-payload finding).
export function buildDashboardContext(data: DataFile | null): DashboardContext {
  const exhibits = data?.exhibits ?? [];
  const exhibitsByStage = Object.fromEntries(STAGES.map((s) => [s.id, [] as Exhibit[]])) as Record<Stage, Exhibit[]>;
  for (const e of exhibits) exhibitsByStage[e.stage].push(e);
  for (const s of Object.keys(exhibitsByStage) as Stage[]) exhibitsByStage[s].sort((a, b) => a.order - b.order);

  const latestNote: Partial<Record<Stage, StageNote>> = {};
  for (const n of data?.notes ?? []) {
    const c = latestNote[n.stage];
    if (!c || n.date > c.date) latestNote[n.stage] = n;
  }

  const annotations = buildAnnotations(exhibits);

  return { generatedAt: data?.generatedAt ?? null, exhibits, exhibitsByStage, latestNote, annotations };
}

// A single stage's own real slice — confirmed by hand that TrackShell.tsx
// and every one of the 6 Track*.tsx files never read anything outside
// this one stage's own exhibits/note (TrackRetentionImmigration's own
// extra Sankey only looks up FIG601/FIG602, both already within this
// slice), so a Track page's real hydration payload is just this stage's
// own ~10-20 exhibits, not the full 91-exhibit corpus every Track page
// used to ship regardless of how many exhibits it actually rendered.
export function buildTrackContext(data: DataFile | null, stage: Stage): TrackDashboardContext {
  const allExhibits = data?.exhibits ?? [];
  const exhibits = allExhibits.filter((e) => e.stage === stage).sort((a, b) => a.order - b.order);
  const note = (data?.notes ?? [])
    .filter((n) => n.stage === stage)
    .sort((a, b) => (a.date > b.date ? -1 : 1))[0];
  // buildAnnotations() only ever looks up specific exhibits by id (see
  // annotations.ts's own byId()/projectionStart()/tab501Crossing()) — a
  // stage-scoped array still finds every one of that stage's own real
  // annotations, confirmed by hand that all 5 currently-registered
  // annotations are self-contained to a single stage's own exhibit(s).
  const annotations = buildAnnotations(exhibits);
  return { stage, exhibits, note, annotations };
}

export function formatGenerated(data: DataFile | null): string {
  return data?.generatedAt
    ? new Date(data.generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
}
