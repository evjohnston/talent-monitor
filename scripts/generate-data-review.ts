// Build-time generation of the automated data review sheet (issue #16) —
// one real record per exhibit, computed from the same public/data/
// talent.json and content/report-crosswalk.csv every other part of this
// app already reads. Writes CSV + JSON into dist/dev/data-review/ (build
// output, never committed, same distinction generate-downloads.ts's own
// dist/downloads/ output draws) and fails the command on real, checkable
// problems (missing sources, duplicate keys, a derived exhibit with no
// calculation note, a raw source file that doesn't actually exist on
// disk) rather than silently shipping a broken review sheet.
//
// Run: npx tsx scripts/generate-data-review.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { DataFile } from "../src/lib/types.ts";
import { rowsToCsv } from "../src/lib/csv.ts";
import { loadCrosswalk } from "../src/lib/loadCrosswalk.ts";
import { buildReviewRecords, validateReviewRecords, type ReviewStatusFile } from "../src/lib/dataReview.ts";

const ROOT = join(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const DATA_PATH = join(ROOT, "public", "data", "talent.json");
const RAW_DATA_DIR = join(ROOT, "talent_charts", "data");
const STATUS_PATH = join(ROOT, "content", "data-review-status.json");

function loadStatusFile(): ReviewStatusFile {
  if (!existsSync(STATUS_PATH)) return {};
  return JSON.parse(readFileSync(STATUS_PATH, "utf-8"));
}

function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ doesn't exist — run `npm run build` first.");
    process.exit(1);
  }

  const data: DataFile = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  const exhibits = data.exhibits;
  const crosswalk = loadCrosswalk();
  const crosswalkByExhibit = new Map(crosswalk.map((r) => [r.reportId, r]));
  const statusFile = loadStatusFile();

  const records = buildReviewRecords(exhibits, crosswalkByExhibit, statusFile);

  // A real disk-existence check for every resolved raw source file — the
  // one part of validation that genuinely needs fs access, so it stays
  // here rather than in dataReview.ts's pure, reusable functions.
  const errors = validateReviewRecords(records, exhibits);
  for (const r of records) {
    for (const file of r.raw_source_files.split("; ").filter(Boolean)) {
      if (!existsSync(join(RAW_DATA_DIR, file))) {
        errors.push({ exhibitId: r.exhibit_id, message: `raw source file "${file}" does not exist on disk` });
      }
    }
  }

  if (errors.length > 0) {
    console.error(`Data review found ${errors.length} real problem(s):`);
    for (const e of errors) console.error(`  ${e.exhibitId}: ${e.message}`);
    process.exit(1);
  }

  const outDir = join(DIST, "dev", "data-review");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "data-review.csv"), rowsToCsv(records as unknown as Record<string, unknown>[]));
  writeFileSync(join(outDir, "data-review.json"), JSON.stringify(records, null, 2));

  console.log(`Generated ${records.length} review records -> ${outDir}`);
  console.log(`Review statuses: ${Object.keys(statusFile).length} exhibit(s) have an author-set status.`);
}

main();
