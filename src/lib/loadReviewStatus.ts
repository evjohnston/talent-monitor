import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ReviewStatusFile } from "./dataReview.ts";

// Same process.cwd()-based build-time read pattern as loadCrosswalk.ts —
// content/data-review-status.json is a real, committed, hand-editable
// file (author-set review_status/review_comment per exhibit id), never
// overwritten by regenerating the review sheet's own calculated fields
// (see scripts/generate-data-review.ts).
const STATUS_PATH = join(process.cwd(), "content", "data-review-status.json");

export function loadReviewStatus(): ReviewStatusFile {
  if (!existsSync(STATUS_PATH)) return {};
  return JSON.parse(readFileSync(STATUS_PATH, "utf-8"));
}
