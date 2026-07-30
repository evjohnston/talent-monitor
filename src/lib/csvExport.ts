// Re-exported from csv.ts, not defined here — see that file's own note
// on why: keeping it out of this file is what lets scripts/generate-
// downloads.ts (a Node build script) import it without pulling in this
// file's OTHER exports' real document/Blob/URL dependencies.
export { rowsToCsv } from "./csv.ts";
import { rowsToCsv } from "./csv.ts";

// Shared Blob -> object URL -> synthetic <a> -> click -> revoke sequence
// — the one real DOM side effect behind every client-side download this
// app offers (CSV, JSON, SVG). Deliberately untested directly (same as
// the original downloadCsv before this refactor); only the pure text/data
// construction each format needs is tested.
function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// "Download this exhibit's real rows" — a plain client-side CSV export,
// no server/new dependency needed. Existed in the pre-rebuild app,
// deleted along with the rest of the Entry-shaped drawer machinery during
// the 2026-07-28 rebuild (see git history on this file) — CLAUDE.md kept
// claiming it survived that rebuild for several sessions after it didn't;
// rebuilt here (same implementation) to make that claim true and to give
// every exhibit a real "download data" control per the redesign brief's
// own per-visual metadata requirement.
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = rowsToCsv(rows);
  if (!csv) return;
  triggerDownload(filename, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

// The exhibit's own real rows/columns, as committed JSON — the same shape
// public/data/talent.json already stores them in, not a bespoke export
// format invented for this button.
export function downloadJson(filename: string, data: unknown) {
  triggerDownload(filename, new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }));
}
