// Extracted from scripts/import-talent-charts.ts (2026-07-30) so
// src/lib/loadCrosswalk.ts (an Astro build-time reader for content/
// report-crosswalk.csv, feeding the /methodology/ route's report-to-web
// crosswalk section) can use the exact same real RFC4180 parser instead
// of a second, potentially-inconsistent implementation. Pure string
// parsing, no fs/DOM dependency — safe to import from either context.
//
// Minimal RFC4180 CSV parser (handles quoted fields, doubled quotes, and
// commas/newlines inside quotes) — no dependency needed for this.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}
