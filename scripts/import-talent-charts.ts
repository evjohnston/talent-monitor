// Imports the real, already-processed exhibit data behind "The Great Talent
// Competition" report (talent_charts/ at the repo root — the report's own R
// project) into public/data/talent.json. Unlike the old quantum/AI
// verticals, there is no live source to poll on a schedule here: every
// number in talent_charts/data/*.csv is already a finished, cited
// government/administrative statistic, produced by the report's own R
// pipeline (see talent_charts/figures.Rmd, tables.Rmd). This script is a
// one-time/periodic import, run by hand after talent_charts/ gets a fresh
// export from the report's authors — see "Ingestion" in CLAUDE.md.
//
// Run: npx tsx scripts/import-talent-charts.ts
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ChartKind, DataFile, Exhibit, Stage } from "../src/lib/types.ts";
import { NOTES } from "../data/talent/notes.ts";

const ROOT = join(import.meta.dirname, "..");
const CHARTS_DIR = join(ROOT, "talent_charts");
const DATA_DIR = join(CHARTS_DIR, "data");
const TITLES_CSV = join(CHARTS_DIR, "titles_and_sources.csv");
const OUT_FILE = join(ROOT, "public", "data", "talent.json");

// ---- minimal RFC4180 CSV parser (handles quoted fields, doubled quotes,
// and commas/newlines inside quotes) — no dependency needed for this. ----
function parseCsv(text: string): string[][] {
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

function coerce(raw: string): string | number | null {
  const v = raw.trim();
  if (v === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

// Drop columns that are entirely empty (pandas "Unnamed: N" export artifacts
// with no real data in them), and columns with a blank header even if one
// row holds a stray value there — confirmed real in FIG513.csv, where one
// row's "skewness" cell lost its decimal point ("3.514" -> "3514"),
// shifting that row's real kurtosis value one column to the right into a
// trailing unnamed column. That's a source-data defect to drop, not a
// real "kurtosis" series to chart — a blank column name is never a
// legitimate metric on its own.
function stripEmptyColumns(columns: string[], rows: Record<string, string | number | null>[]) {
  const keep = columns.filter((c) => c.trim() !== "" && rows.some((r) => r[c] !== null && r[c] !== ""));
  const cleanRows = rows.map((r) => {
    const out: Record<string, string | number | null> = {};
    for (const c of keep) out[c] = r[c];
    return out;
  });
  return { columns: keep, rows: cleanRows };
}

// A pivot export's own "Grand Total" footer row (confirmed real, e.g. the
// last row of FIG302.csv/FIG410.csv) sums every other row in that column —
// keeping it as if it were one more real company/country would make it
// outrank every genuine entity on every leaderboard. Dropped at read time,
// not left for a chart component to filter out one shape at a time.
const isTotalRow = (v: string | number | null) => typeof v === "string" && /^(grand\s+)?total$/i.test(v.trim());

function readExhibitCsv(id: string): { columns: string[]; rows: Record<string, string | number | null>[] } | null {
  const path = join(DATA_DIR, `${id}.csv`);
  if (!existsSync(path)) return null;
  const table = parseCsv(readFileSync(path, "utf-8"));
  if (table.length < 1) return null;
  const columns = table[0];
  const rows = table
    .slice(1)
    .map((r) => {
      const obj: Record<string, string | number | null> = {};
      columns.forEach((col, i) => { obj[col] = coerce(r[i] ?? ""); });
      return obj;
    })
    .filter((r) => !isTotalRow(r[columns[0]]));
  return stripEmptyColumns(columns, rows);
}

function inferKind(columns: string[], rows: Record<string, string | number | null>[]): ChartKind {
  const [first, ...rest] = columns;
  const yearLike = (s: string) => /^\d{4}$/.test(s.trim());
  const firstIsYear = /^year$/i.test(first ?? "");
  // tolerate one trailing non-year summary column, e.g. "Grand Total"
  const yearCols = rest.filter(yearLike);
  const restAreYears = yearCols.length >= 2 && yearCols.length >= rest.length - 1;

  // Checked BEFORE firstIsYear, deliberately: FIG410/411 (UNESCO country x
  // year mobility data) name their own entity column "Year" even though
  // its real values are country names — a real, confirmed export quirk,
  // not a hypothetical. "every other column is itself a 4-digit year" is
  // a strong enough signal on its own that this is an entity x year grid,
  // regardless of what column 0 happens to be named.
  if (restAreYears) return "leaderboard-years";
  if (firstIsYear) {
    // country-cross-section-over-time (many countries as columns) still
    // renders best as a multi-series time chart, same as a plain timeseries.
    const looksLikeShare = rest.every((c) => /\b(share|percent|pct|rate)\b|%/i.test(c))
      || rows.every((r) => rest.every((c) => {
        const v = r[c];
        return v === null || (typeof v === "number" && v >= -1.5 && v <= 1.5);
      }));
    return looksLikeShare && rest.length <= 4 ? "share-timeseries" : "timeseries";
  }
  if (/^country$/i.test(first ?? "") && rest.length <= 3) return "country-map";
  return "ranked-bar";
}

// ---- fig_no -> chapter -> stage ----
const CHAPTER_TO_STAGE: Record<number, Stage> = {
  1: "degree-production",
  2: "graduate-training",
  3: "workforce-entry",
  4: "foundation",
  5: "research-output",
  6: "retention-immigration",
};

function chapterOf(id: string): number {
  // FIG101 -> 1, TAB604 -> 6
  const m = id.match(/^(?:FIG|TAB)(\d)/);
  return m ? Number(m[1]) : 0;
}

function orderOf(id: string): number {
  const m = id.match(/^(FIG|TAB)(\d{3})/);
  if (!m) return 999;
  const prefixRank = m[1] === "FIG" ? 0 : 500;
  return prefixRank + Number(m[2]);
}

// ---- multi-part exhibits: some exhibits' underlying CSV was exported in
// named slices (talent_charts/figures.Rmd / tables.Rmd's own `sources =`
// lists give the real per-part label) rather than one file per fig_no. Two
// shapes: "split" (each part becomes its own exhibit, same shape but a
// different population — e.g. one table per STEM field) and "merge"
// (parts share the same Year axis, columns get prefixed with the part
// label and folded into one exhibit).
type PartsMode = "split" | "merge";
interface PartsSpec { mode: PartsMode; parts: { suffix: string; label: string }[] }

const PARTS: Record<string, PartsSpec> = {
  FIG301: { mode: "merge", parts: [{ suffix: "a", label: "U.S.-born" }, { suffix: "b", label: "Foreign-born" }] },
  FIG604: { mode: "merge", parts: [{ suffix: "a", label: "All industries" }, { suffix: "b", label: "Tech sector" }] },
  FIG605: { mode: "merge", parts: [{ suffix: "a", label: "All industries" }, { suffix: "b", label: "Tech sector" }] },
  TAB202: {
    mode: "split",
    parts: [
      { suffix: "a", label: "Engineering" },
      { suffix: "b", label: "Math and Computer Science" },
      { suffix: "c", label: "Physical and Life Sciences" },
    ],
  },
  TAB203: {
    mode: "split",
    parts: [{ suffix: "a", label: "Science" }, { suffix: "b", label: "Engineering" }, { suffix: "c", label: "Health" }],
  },
  TAB204: {
    mode: "merge",
    parts: [{ suffix: "a", label: "U.S. citizens & permanent residents" }, { suffix: "b", label: "Temporary visa holders" }],
  },
  TAB505: {
    mode: "split",
    parts: [
      { suffix: "a", label: "Biotechnology" },
      { suffix: "b", label: "Semiconductors" },
      { suffix: "c", label: "Computer technology" },
    ],
  },
};

// Exhibits computed inline in the report's own R pipeline from another
// exhibit's data rather than read from a standalone CSV — see figures.Rmd/
// tables.Rmd for the real derivation. Not yet ported; skipped rather than
// guessed at. FIG303 is the one exception ported below (a simple top-10
// year-by-year share of FIG302's real company data).
const SKIP_COMPUTED = ["FIG405", "TAB303", "TAB503", "TAB504", "TAB603", "TAB605"];

function buildFig303(fig302: { columns: string[]; rows: Record<string, string | number | null>[] } | null) {
  if (!fig302) return null;
  const years = fig302.columns.filter((c) => /^\d{4}$/.test(c));
  const rows = years.map((year) => {
    const values = fig302.rows
      .map((r) => (typeof r[year] === "number" ? (r[year] as number) : 0))
      .sort((a, b) => b - a);
    const total = values.reduce((s, v) => s + v, 0);
    const top10 = values.slice(0, 10).reduce((s, v) => s + v, 0);
    return { Year: Number(year), "Top 10 employers' share of approvals": total > 0 ? Math.round((top10 / total) * 1000) / 10 : null };
  });
  return { columns: ["Year", "Top 10 employers' share of approvals"], rows };
}

interface TitleRow { id: string; title: string; sourceShort: string; sourceLong: string }

function loadTitles(): Map<string, TitleRow> {
  const table = parseCsv(readFileSync(TITLES_CSV, "utf-8"));
  const map = new Map<string, TitleRow>();
  for (const r of table.slice(1)) {
    const [id, , title, sourceShort, sourceLong] = r;
    if (!id) continue;
    map.set(id, { id, title, sourceShort, sourceLong });
  }
  return map;
}

function extractUrls(sourceLong: string): string[] {
  // Real bug, caught while building the Phase 1.4 metric registry: excluding
  // "." from the URL body (meant to drop a trailing sentence period) instead
  // truncated every URL at its FIRST period — "https://ncses.nsf.gov/..."
  // became just "https://ncses". Every citation link in the app was broken
  // this way from the very first rebuild. Fixed by allowing periods in the
  // match, then trimming only real trailing sentence punctuation after.
  const matches = sourceLong.match(/https?:\/\/[^\s,;"')]+/g) ?? [];
  return [...new Set(matches.map((u) => u.replace(/[.,;]+$/, "")))];
}

function main() {
  const titles = loadTitles();
  const finalIds = [...titles.keys()].filter((id) => !id.startsWith("AF") && !id.startsWith("AT"));

  const exhibits: Exhibit[] = [];
  const skipped: string[] = [];
  let fig302Cache: { columns: string[]; rows: Record<string, string | number | null>[] } | null = null;

  for (const id of finalIds) {
    if (SKIP_COMPUTED.includes(id)) { skipped.push(id); continue; }
    const meta = titles.get(id)!;
    const stage = CHAPTER_TO_STAGE[chapterOf(id)];
    const chapter = chapterOf(id);
    const baseOrder = orderOf(id);

    const direct = readExhibitCsv(id);
    if (direct) {
      exhibits.push({
        id, stage, chapter, order: baseOrder, title: meta.title,
        kind: inferKind(direct.columns, direct.rows),
        sourceShort: meta.sourceShort, sourceLong: meta.sourceLong, sourceUrls: extractUrls(meta.sourceLong),
        columns: direct.columns, rows: direct.rows,
      });
      if (id === "FIG302") fig302Cache = direct;
      continue;
    }

    const spec = PARTS[id];
    if (!spec) { skipped.push(id); continue; }

    const partTables = spec.parts.map((p) => ({ p, t: readExhibitCsv(`${id}${p.suffix}`) }));
    if (partTables.some(({ t }) => !t)) { skipped.push(id); continue; }

    if (spec.mode === "split") {
      partTables.forEach(({ p, t }, i) => {
        exhibits.push({
          id: `${id}-${p.suffix}`, stage, chapter, order: baseOrder + i / 10, title: `${meta.title} — ${p.label}`,
          kind: inferKind(t!.columns, t!.rows),
          sourceShort: meta.sourceShort, sourceLong: meta.sourceLong, sourceUrls: extractUrls(meta.sourceLong),
          columns: t!.columns, rows: t!.rows,
        });
      });
    } else {
      const key = partTables[0].t!.columns[0]; // shared join key, e.g. "Year"
      const allKeys = [...new Set(partTables.flatMap(({ t }) => t!.rows.map((r) => r[key])))].sort((a, b) => Number(a) - Number(b));
      const columns = [key, ...partTables.flatMap(({ p, t }) => t!.columns.slice(1).map((c) => `${p.label}: ${c}`))];
      const rows = allKeys.map((k) => {
        const row: Record<string, string | number | null> = { [key]: k };
        for (const { p, t } of partTables) {
          const src = t!.rows.find((r) => r[key] === k);
          for (const c of t!.columns.slice(1)) row[`${p.label}: ${c}`] = src ? src[c] : null;
        }
        return row;
      });
      exhibits.push({
        id, stage, chapter, order: baseOrder, title: meta.title,
        kind: inferKind(columns, rows),
        sourceShort: meta.sourceShort, sourceLong: meta.sourceLong, sourceUrls: extractUrls(meta.sourceLong),
        columns, rows,
      });
    }
  }

  // FIG303: real, derived from FIG302's own already-imported data (top-10
  // employers' share of total approvals, by year) — see buildFig303.
  const fig303Meta = titles.get("FIG303");
  const fig303 = fig302Cache && fig303Meta ? buildFig303(fig302Cache) : null;
  if (fig303 && fig303Meta) {
    exhibits.push({
      id: "FIG303", stage: CHAPTER_TO_STAGE[3], chapter: 3, order: orderOf("FIG303"), title: fig303Meta.title,
      kind: "timeseries",
      sourceShort: fig303Meta.sourceShort, sourceLong: fig303Meta.sourceLong, sourceUrls: extractUrls(fig303Meta.sourceLong),
      columns: fig303.columns, rows: fig303.rows,
    });
    skipped.splice(skipped.indexOf("FIG303"), 1);
  }

  exhibits.sort((a, b) => a.order - b.order);

  const dataFile: DataFile = {
    generatedAt: new Date().toISOString(),
    exhibits,
    notes: NOTES,
  };

  writeFileSync(OUT_FILE, JSON.stringify(dataFile, null, 2));

  const byStage = new Map<string, number>();
  for (const e of exhibits) byStage.set(e.stage, (byStage.get(e.stage) ?? 0) + 1);
  console.log(`Imported ${exhibits.length} exhibits -> ${OUT_FILE}`);
  for (const [stage, n] of byStage) console.log(`  ${stage}: ${n}`);
  console.log(`Skipped (no CSV / computed inline in the report's R pipeline, not yet ported): ${skipped.join(", ")}`);
}

main();
