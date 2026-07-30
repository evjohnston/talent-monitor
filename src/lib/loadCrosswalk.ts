import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsv } from "./parseCsv.ts";

// Read directly off disk at Astro build time, same pattern as
// loadTalentData.ts (process.cwd(), not import.meta.url — Astro relocates
// this module into dist/.prerender/chunks/ during build). Feeds the
// /methodology/ route's real report-to-web crosswalk section straight
// from content/report-crosswalk.csv rather than a second, hand-authored
// copy of the same information.
export interface CrosswalkRow {
  reportId: string;
  reportType: string;
  reportChapter: string;
  reportTitle: string;
  stage: string;
  dataSource: string;
  sourceYear: string;
  currentWebComponent: string;
  proposedWebRole: string;
  priority: string;
  status: string;
  caveat: string;
  notes: string;
}

const CROSSWALK_PATH = join(process.cwd(), "content", "report-crosswalk.csv");

export function loadCrosswalk(): CrosswalkRow[] {
  const text = readFileSync(CROSSWALK_PATH, "utf-8");
  const table = parseCsv(text);
  const [header, ...rows] = table;
  const idx = (col: string) => header.indexOf(col);
  const get = (row: string[], col: string) => row[idx(col)] ?? "";
  return rows.map((row) => ({
    reportId: get(row, "report_id"),
    reportType: get(row, "report_type"),
    reportChapter: get(row, "report_chapter"),
    reportTitle: get(row, "report_title"),
    stage: get(row, "stage"),
    dataSource: get(row, "data_source"),
    sourceYear: get(row, "source_year"),
    currentWebComponent: get(row, "current_web_component"),
    proposedWebRole: get(row, "proposed_web_role"),
    priority: get(row, "priority"),
    status: get(row, "status"),
    caveat: get(row, "caveat"),
    notes: get(row, "notes"),
  }));
}
