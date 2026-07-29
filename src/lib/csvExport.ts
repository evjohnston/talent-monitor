// "Download this exhibit's real rows" — a plain client-side CSV export,
// no server/new dependency needed. Existed in the pre-rebuild app,
// deleted along with the rest of the Entry-shaped drawer machinery during
// the 2026-07-28 rebuild (see git history on this file) — CLAUDE.md kept
// claiming it survived that rebuild for several sessions after it didn't;
// rebuilt here (same implementation) to make that claim true and to give
// every exhibit a real "download data" control per the redesign brief's
// own per-visual metadata requirement.
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
