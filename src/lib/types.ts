// The pipeline stages — a STEM-talent lifecycle, not a technology pipeline.
// Order matters: it's the funnel, foundation through competitiveness. See
// CLAUDE.md's "Talent pipeline" section for how each stage maps to the
// source report's chapters (talent_charts/titles_and_sources.csv).
export type Stage =
  | "foundation" // K-12 outcomes, school spending, early persistence/attrition, study abroad
  | "degree-production" // completions, STEM share, doctorates overview
  | "graduate-training" // grad enrollment, postdocs, international students by level/field
  | "workforce-entry" // who works in STEM, H-1B employers, AI-company founders
  | "retention-immigration" // stay rates, OPT, H-1B volume/denials, PERM, green-card waits
  | "research-output"; // citations, Nobel/Turing, university rankings, R&D spend, patents

// How an exhibit's real data is shaped — drives which chart component
// renders it. Inferred from each CSV's column shape by
// scripts/import-talent-charts.ts, not hand-tagged per exhibit.
export type ChartKind =
  | "timeseries" // year -> one or more numeric series (the majority of exhibits)
  | "share-timeseries" // year -> percentage/share series
  | "leaderboard-years" // entity (+ country) -> value per year
  | "ranked-bar" // entity/category -> single value, one snapshot
  | "country-map"; // country -> value

// One real exhibit from the report this app is built on ("The Great Talent
// Competition") — every field traces to talent_charts/titles_and_sources.csv
// and talent_charts/data/<id>.csv, both hand-produced and cited by the
// report's own R pipeline. There is no live-fetch/hand-verified/auto-
// classified distinction here the way the old quantum/AI verticals had
// (see Provenance in the git history) — every exhibit is equally a finished,
// cited government/administrative statistic. `rows`/`columns` are the CSV
// as parsed, not reshaped, so a chart component decides how to read them
// rather than the importer guessing a shape it might get wrong.
export interface Exhibit {
  id: string; // fig_no, e.g. "FIG101" — stable key, matches the source CSV filename
  stage: Stage;
  chapter: number; // 1-6, the source report's own chapter — kept for traceability even though stage order differs from chapter order
  order: number; // display order within its stage
  title: string; // real exhibit title, from titles_and_sources.csv
  kind: ChartKind;
  sourceShort: string;
  sourceLong: string;
  sourceUrls: string[]; // parsed out of source_long
  columns: string[]; // raw CSV header row
  rows: Record<string, string | number | null>[]; // raw CSV rows, numeric coercion applied per cell
}

// A dated analyst note attached to a pipeline stage — the "so what" layer.
// Written by a human, held in data/talent/notes.ts. This is what a
// 10-minute reader gets before the raw exhibit data.
export interface StageNote {
  stage: Stage;
  date: string; // ISO date the note was written
  author: string;
  headline: string; // one line, the takeaway
  body: string; // 2-4 sentences of interpretation
}

// The shape of the committed data file the app reads at load. One file,
// one subject — there's no multi-vertical switching anymore (see
// CLAUDE.md's "Single vertical" note).
export interface DataFile {
  generatedAt: string; // ISO timestamp of the last import run
  exhibits: Exhibit[];
  notes: StageNote[];
}

export const STAGES: { id: Stage; label: string; blurb: string }[] = [
  {
    id: "foundation",
    label: "Foundation",
    blurb: "K-12 outcomes, school spending, and early persistence. Who enters the pipeline, and how many make it through the first years.",
  },
  {
    id: "degree-production",
    label: "Degree Production",
    blurb: "Completions and doctorates. How many STEM degrees the US actually produces, and who earns them.",
  },
  {
    id: "graduate-training",
    label: "Graduate & Postdoctoral Training",
    blurb: "Graduate enrollment, postdocs, and international students. Who trains at the research level.",
  },
  {
    id: "workforce-entry",
    label: "Workforce Entry",
    blurb: "Who actually works in STEM after training, and how employers hire talent from abroad.",
  },
  {
    id: "retention-immigration",
    label: "Retention & Immigration",
    blurb: "Who stays after training, and the visa mechanics that decide it.",
  },
  {
    id: "research-output",
    label: "Research Output & Competitiveness",
    blurb: "Citations, prizes, rankings, R&D spend, and patents. Whether the pipeline's output actually leads.",
  },
];
