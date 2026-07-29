import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DataFile } from "./types.ts";

// public/data/talent.json is the one real, committed data file (see
// CLAUDE.md's "Ingestion" section / scripts/import-talent-charts.ts) —
// read directly off disk here since every Astro page loads it at build
// time in Node, not via a browser fetch the way the old SPA's App.tsx
// did. One shared read/parse so it isn't duplicated per page.
//
// Resolved from process.cwd(), not import.meta.url — Astro's build
// bundles this module into dist/.prerender/chunks/, so an
// import.meta.url-relative path would resolve against that relocated
// chunk's location instead of the real source tree. `astro build`/
// `astro dev` (and the GitHub Actions workflow) always run from the repo
// root, so cwd is reliable here the way it isn't for a bundled path.
const DATA_PATH = join(process.cwd(), "public", "data", "talent.json");

export function loadTalentData(): DataFile {
  return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
}
