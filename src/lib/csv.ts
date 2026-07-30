// Split out of csvExport.ts deliberately (2026-07-30) — that file's OTHER
// exports (downloadCsv/downloadJson) reference document/Blob/URL, which
// don't exist under tsconfig.node.json's DOM-free project. This pure
// string-building function has no such dependency, so it lives here
// instead, importable by both csvExport.ts (browser context, re-exports
// it below for backward compat) and scripts/generate-downloads.ts (a Node
// build script) without either pulling in the other's baggage.
//
// A value containing a comma, quote, or newline gets quoted with internal
// quotes doubled, standard CSV escaping; `null`/`undefined` become an
// empty field, not the string "null".
export function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return lines.join("\n");
}
