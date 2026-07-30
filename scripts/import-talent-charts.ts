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
import { canonicalizeCompany } from "../src/lib/entityResolution.ts";

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
  // Thousands-comma-formatted numbers ("2,302.00") — real, confirmed in
  // FIG404's own K-12/Tertiary spending columns, invisible to
  // numericColumns() (and to FIG405's own derivation, see below) until
  // this existed: FIG404 was silently ranked by a %-of-GDP column instead
  // because its own dollar-figure columns read as strings. Only matches a
  // real 3-digit thousands grouping (1,234 not 1,23), so a genuine
  // non-numeric string that happens to contain a comma (a name, a list)
  // isn't accidentally coerced — checked against every exhibit's real
  // imported data before shipping this: FIG404 is the only one affected.
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(v)) return Number(v.replace(/,/g, ""));
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
// exhibit's data (or, for TAB605, from real source CSVs that exist but
// were never given their own titles_and_sources.csv entry) rather than
// read from a standalone final CSV — see figures.Rmd/tables.Rmd for each
// one's real derivation. FIG303/FIG405/TAB303/TAB503/TAB504/TAB605 are
// all ported below now (2026-07-29), each replicating that exact R
// computation from already-real source data — see the build* functions.
// TAB603 alone is still skipped: its own real R source
// (build_sector_bookend_table) reads AF60/AF61, which are genuinely
// archived exhibits the report's own authors cut before the final
// manuscript (see CLAUDE.md's "Known gaps") — porting it means first
// deciding whether to import archived source data at all, a bigger,
// separate call than replicating a formula.
const SKIP_COMPUTED = ["TAB603"];

type Table = { columns: string[]; rows: Record<string, string | number | null>[] };

// FIG302's own exported rows stay exactly as USCIS reported them — the
// "raw file actually used" (see the downloads work) never gets rewritten.
// This builds a SEPARATE, re-aggregated view for FIG303/TAB303's own
// already-derived, already-disclosed-as-computed calculations, grouping
// only real, confirmed, CONTEMPORANEOUS same-parent subsidiary names
// (src/lib/entityResolution.ts's own ALIASES — e.g. "HP Enterprise Svcs
// LLC" + "Hewlett Packard Enterprise Company" are the same real company at
// the same time, not a historical merger). A real historical
// merger/acquisition (Satyam -> Tech Mahindra, L&T Infotech + Mindtree ->
// LTIMindtree) deliberately does NOT get grouped here — each keeps its own
// pre-merger years attributed to the entity that actually filed them (see
// entityResolution.ts's CORPORATE_LINEAGE for the disclosed relationship
// instead). Confirmed by hand against the real 252-row FIG302 employer
// list (2026-07-30): only one real group exists (Hewlett Packard
// Enterprise), so this changes FIG303/TAB303's numbers only where that one
// real company was previously undercounted as two separate smaller ones.
function canonicalizeFig302(fig302: Table): Table {
  const years = fig302.columns.filter((c) => /^\d{4}$/.test(c));
  const byId = new Map<string, { name: string; values: Record<string, number> }>();
  for (const row of fig302.rows) {
    const raw = String(row.Company ?? "");
    const { id, name } = canonicalizeCompany(raw);
    if (!byId.has(id)) byId.set(id, { name, values: Object.fromEntries(years.map((y) => [y, 0])) });
    const entry = byId.get(id)!;
    for (const y of years) {
      const v = row[y];
      if (typeof v === "number") entry.values[y] += v;
    }
  }
  const rows = [...byId.values()].map((e) => ({ Company: e.name, ...e.values }));
  return { columns: fig302.columns, rows };
}

function buildFig303(fig302: Table | null) {
  if (!fig302) return null;
  const grouped = canonicalizeFig302(fig302);
  const years = grouped.columns.filter((c) => /^\d{4}$/.test(c));
  const rows = years.map((year) => {
    const values = grouped.rows
      .map((r) => (typeof r[year] === "number" ? (r[year] as number) : 0))
      .sort((a, b) => b - a);
    const total = values.reduce((s, v) => s + v, 0);
    const top10 = values.slice(0, 10).reduce((s, v) => s + v, 0);
    return { Year: Number(year), "Top 10 employers' share of approvals": total > 0 ? Math.round((top10 / total) * 1000) / 10 : null };
  });
  return { columns: ["Year", "Top 10 employers' share of approvals"], rows };
}

// TAB303 ("Top Employers Receiving H-1B Approvals") — real per-company
// comparison of 2017 vs. 2025 share of approvals, from FIG302's own
// already-imported employer x year data. Replicates tables.Rmd's
// fig030_shares()/tab_012: share = a company's own count / that year's
// real total (summed across all real companies, not a stored "Grand
// Total" — the importer already drops that footer row, see isTotalRow),
// restricted to the union of firms that were top-10 BY COUNT in either
// bookend year, ranked by the point change between them.
function buildTab303(fig302: Table | null) {
  if (!fig302) return null;
  const grouped = canonicalizeFig302(fig302);
  const FIRST_YEAR = "2017", LAST_YEAR = "2025";
  if (!grouped.columns.includes(FIRST_YEAR) || !grouped.columns.includes(LAST_YEAR)) return null;
  const shareByCompany = (year: string) => {
    const total = grouped.rows.reduce((s, r) => s + (typeof r[year] === "number" ? (r[year] as number) : 0), 0);
    return new Map(
      grouped.rows.map((r) => {
        const count = typeof r[year] === "number" ? (r[year] as number) : 0;
        return [String(r.Company), { count, share: total > 0 ? (count / total) * 100 : 0 }];
      })
    );
  };
  const firstShares = shareByCompany(FIRST_YEAR);
  const lastShares = shareByCompany(LAST_YEAR);
  const top10ByCount = (m: Map<string, { count: number; share: number }>) =>
    [...m.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 10).map(([company]) => company);
  const unionFirms = new Set([...top10ByCount(firstShares), ...top10ByCount(lastShares)]);
  const rows = [...unionFirms]
    .map((company) => {
      const s1 = firstShares.get(company)?.share ?? 0;
      const s2 = lastShares.get(company)?.share ?? 0;
      return {
        Company: company,
        [`${FIRST_YEAR} share`]: Math.round(s1 * 10) / 10,
        [`${LAST_YEAR} share`]: Math.round(s2 * 10) / 10,
        "Change (points)": Math.round((s2 - s1) * 10) / 10,
      };
    })
    .sort((a, b) => (b["Change (points)"] as number) - (a["Change (points)"] as number));
  return { columns: ["Company", `${FIRST_YEAR} share`, `${LAST_YEAR} share`, "Change (points)"], rows };
}

// FIG405 ("How Lopsided Is U.S. Education Spending?") — real
// tertiary-to-K-12 per-student spending ratio, from FIG404's own
// already-imported columns. Replicates figures.Rmd's fig_118: Ratio =
// Tertiary / K-12, excluding the 3 aggregate/outlier rows the report's
// own chart drops ("EU25 average", "G20 average", "China" — real,
// deliberate exclusions in the source, not guessed at here). Needed
// coerce() to learn to parse "2,302.00"-style thousands-comma numbers
// first — see that function's own note — since FIG404's dollar columns
// were silently read as strings otherwise.
function buildFig405(fig404: Table | null) {
  if (!fig404) return null;
  const EXCLUDED = new Set(["EU25 average", "G20 average", "China"]);
  const rows = fig404.rows
    .filter((r) => typeof r.Country === "string" && !EXCLUDED.has(r.Country))
    .map((r) => {
      const k12 = r["K-12 (in USD)"];
      const tertiary = r["Tertiary (in USD)"];
      if (typeof k12 !== "number" || typeof tertiary !== "number" || k12 === 0) return null;
      return { Country: r.Country, "Tertiary-to-K-12 spending ratio": Math.round((tertiary / k12) * 100) / 100 };
    })
    .filter((r): r is { Country: string | number | null; "Tertiary-to-K-12 spending ratio": number } => r !== null);
  return { columns: ["Country", "Tertiary-to-K-12 spending ratio"], rows };
}

// TAB503 ("Is R&D Spending Aimed at Today or Tomorrow?") and TAB504
// ("Business Now Dominates R&D in Both Countries") share one real shape
// in tables.Rmd — a US-vs-China, category-by-category comparison across
// the report's own 4 chosen "bookend" years (1994/2004/2014/2024), not
// every real year FIG510/FIG511 have (a full time series is already
// those exhibits' own job). This replicates the level columns and the
// overall bookend change tables.Rmd computes; the report's own
// additional interim-year change columns (Chg2004/Chg2014/Chg2024)
// aren't reproduced here — a real, disclosed simplification (the full
// per-year values are still in FIG510/FIG511 themselves, and every real
// exhibit's own CSV is one click away via "Download this exhibit's data").
function buildBookendTypeTable(source: Table | null, typeCol: string, valueCol: string) {
  if (!source) return null;
  const YEARS = [1994, 2004, 2014, 2024];
  const countries = ["United States", "China"];
  const types = [...new Set(source.rows.map((r) => String(r[typeCol])))];
  const valueAt = (country: string, type: string, year: number) => {
    const match = source.rows.find((r) => r.Country === country && r[typeCol] === type && Number(r.Year) === year);
    return match && typeof match[valueCol] === "number" ? (match[valueCol] as number) : null;
  };
  const rows: Record<string, string | number | null>[] = [];
  for (const country of countries) {
    for (const type of types) {
      const values = YEARS.map((y) => valueAt(country, type, y));
      const first = values[0];
      const last = values[values.length - 1];
      const row: Record<string, string | number | null> = { Country: country, Type: type };
      YEARS.forEach((y, i) => { row[String(y)] = values[i] != null ? Math.round(values[i]! * 100) / 100 : null; });
      row["Change (%)"] = first != null && last != null && first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : null;
      rows.push(row);
    }
  }
  return { columns: ["Country", "Type", ...YEARS.map(String), "Change (%)"], rows };
}

// TAB605 ("Green-Card Wait Times by Region") — real EB1/EB2/EB3
// wait-time-in-months data for 3 real regions (Rest of World, China,
// India), at the report's own 5 chosen years (2005/2010/2015/2020/2025).
// TAB605a/b/c.csv are real source files that exist in talent_charts/data/
// but were never given their own titles_and_sources.csv row — they're
// tables.Rmd's own build_eb_combined_table() inputs, not independently
// citable exhibits, so read directly here rather than through the normal
// finalIds loop. Each source stores wait time as text ("3 years 9
// months"); toMonths() replicates the R helper of the same name.
function toMonths(text: string | number | null): number | null {
  if (typeof text !== "string") return null;
  const y = text.match(/(\d+)\s*years?/);
  const m = text.match(/(\d+)\s*months?/);
  if (!y && !m) return null;
  return (y ? Number(y[1]) : 0) * 12 + (m ? Number(m[1]) : 0);
}
function buildTab605(regions: { label: string; table: Table | null }[]) {
  if (regions.some((r) => !r.table)) return null;
  const YEARS = [2005, 2010, 2015, 2020, 2025];
  const rows = YEARS.map((year) => {
    const row: Record<string, string | number | null> = { Year: year };
    for (const { label, table } of regions) {
      const match = table!.rows.find((r) => Number(r.Year) === year);
      row[`${label}: EB1`] = match ? toMonths(match["EB1.1"]) : null;
      row[`${label}: EB2`] = match ? toMonths(match["EB2.1"]) : null;
      row[`${label}: EB3`] = match ? toMonths(match["EB3.1"]) : null;
    }
    return row;
  });
  const columns = ["Year", ...regions.flatMap(({ label }) => [`${label}: EB1`, `${label}: EB2`, `${label}: EB3`])];
  return { columns, rows };
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
  let fig302Cache: Table | null = null;
  let fig404Cache: Table | null = null;
  let fig510Cache: Table | null = null;
  let fig511Cache: Table | null = null;

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
      if (id === "FIG404") fig404Cache = direct;
      if (id === "FIG510") fig510Cache = direct;
      if (id === "FIG511") fig511Cache = direct;
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

  // The rest of SKIP_COMPUTED's real derivations (2026-07-29) — same
  // "real, derived from already-imported/real source data" pattern as
  // FIG303 above, just generalized into one helper rather than repeating
  // FIG303's own block 5 more times. `kind` is inferred, not hardcoded,
  // except where noted (TAB605 is genuinely timeseries-shaped and
  // inferKind's own heuristics weren't written with a 9-series Year table
  // in mind).
  function pushDerived(id: string, table: Table | null, kind?: ChartKind) {
    const meta = titles.get(id);
    if (!table || !meta || table.rows.length === 0) return;
    exhibits.push({
      id, stage: CHAPTER_TO_STAGE[chapterOf(id)], chapter: chapterOf(id), order: orderOf(id), title: meta.title,
      kind: kind ?? inferKind(table.columns, table.rows),
      sourceShort: meta.sourceShort, sourceLong: meta.sourceLong, sourceUrls: extractUrls(meta.sourceLong),
      columns: table.columns, rows: table.rows,
    });
    const i = skipped.indexOf(id);
    if (i >= 0) skipped.splice(i, 1);
  }

  pushDerived("TAB303", buildTab303(fig302Cache));
  pushDerived("FIG405", buildFig405(fig404Cache));
  pushDerived("TAB503", buildBookendTypeTable(fig510Cache, "Research Type", "USD, PPP conv, BN"));
  pushDerived("TAB504", buildBookendTypeTable(fig511Cache, "Category", "USD_PPP_BN"));
  pushDerived(
    "TAB605",
    buildTab605([
      { label: "Rest of World", table: readExhibitCsv("TAB605a") },
      { label: "China", table: readExhibitCsv("TAB605b") },
      { label: "India", table: readExhibitCsv("TAB605c") },
    ]),
    "timeseries"
  );

  // Real methodology metadata (2026-07-30) — see Exhibit's own comment in
  // types.ts for why this is a short, hand-confirmed list rather than a
  // field populated from content/report-crosswalk.csv's unit/
  // population_definition columns (checked by hand: every one of those
  // still reads "TBD" for every exhibit actually rendered today). Applied
  // as one pass over the final `exhibits` array rather than threading a
  // new parameter through every push site above — same real data, simpler
  // to keep this list in one place and get maintained.
  const DERIVED_META: Record<string, { derivedFrom: string[]; calculationNote: string }> = {
    FIG303: {
      derivedFrom: ["FIG302"],
      calculationNote: "Computed by this site, not the report: each year's ten largest H-1B employers' approvals, summed and divided by that year's total across all employers. Employer names are grouped for real, contemporaneous same-parent subsidiaries (e.g. Hewlett Packard Enterprise's own services subsidiary) before ranking — see src/lib/entityResolution.ts. A real historical merger or acquisition does not get grouped; each company keeps its own pre-merger years.",
    },
    TAB303: {
      derivedFrom: ["FIG302"],
      calculationNote: "Computed by this site, not the report: each employer's own share of that year's total H-1B approvals, for 2017 and 2025, restricted to companies that were top-10 by count in either year. Same employer-name grouping as FIG303.",
    },
    FIG405: {
      derivedFrom: ["FIG404"],
      calculationNote: "Computed by this site, not the report: tertiary per-student spending divided by K-12 per-student spending, for each country in FIG404 with both real values (three aggregate/outlier rows the report's own chart drops — EU25 average, G20 average, China — are excluded here too).",
    },
    TAB503: {
      derivedFrom: ["FIG510"],
      calculationNote: "Computed by this site, not the report: FIG510's own basic-vs-applied-vs-development R&D spending reshaped into a bookend (earliest vs. latest year) comparison table.",
    },
    TAB504: {
      derivedFrom: ["FIG511"],
      calculationNote: "Computed by this site, not the report: FIG511's own R&D-by-sector spending reshaped into a bookend (earliest vs. latest year) comparison table.",
    },
    TAB605: {
      derivedFrom: ["TAB605a", "TAB605b", "TAB605c"],
      calculationNote: "Computed by this site from three real source files (talent_charts/data/TAB605a/b/c.csv — Rest of World, China, and India green-card wait times) that exist in the report's own data but were never given their own titles_and_sources.csv entry, since they're the report's own R pipeline's inputs, not independently citable exhibits.",
    },
  };

  const DATA_NOTES: Record<string, string> = {
    FIG101: "Doctorate counts for 1900-1901, 1916, and 1923 are historical estimates (Thurgood, Golladay, and Hill 2006); every other year (1902-1915, 1917-1922, 1924 onward) is an NCES/NCSES-confirmed count, per the source CSV's own per-year estimate/confirmed flag.",
    FIG601: "Measures international PhD recipients' own stated INTENT to stay, from a near-graduation survey — a different population and a different measure than FIG602's tracked-cohort stay rates. The two should not be read as the same population's before/after.",
    FIG602: "Measures a tracked cohort's actual observed location 5 and 10 years after the PhD — a different population and a different measure than FIG601's near-graduation intent survey. The two should not be read as the same population's before/after.",
  };

  for (const e of exhibits) {
    const derived = DERIVED_META[e.id];
    if (derived) { e.derivedFrom = derived.derivedFrom; e.calculationNote = derived.calculationNote; }
    const note = DATA_NOTES[e.id];
    if (note) e.dataNote = note;
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
