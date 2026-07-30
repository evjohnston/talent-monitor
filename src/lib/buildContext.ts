import type { DataFile, Exhibit, Stage, StageNote } from "./types.ts";
import { STAGES } from "./types.ts";
import type { DashboardContext } from "../dashboards/types.ts";
import { buildAnnotations } from "./annotations.ts";

// Built once per page, at build time (each .astro page imports
// public/data/talent.json directly and calls this) — the same
// exhibitsByStage/latestNote grouping App.tsx used to compute client-side
// in a useMemo, moved here so both a static Astro page and the React
// islands it mounts read from one real implementation.
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

  return { data, exhibits, exhibitsByStage, latestNote, annotations };
}

export function formatGenerated(data: DataFile | null): string {
  return data?.generatedAt
    ? new Date(data.generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
}
