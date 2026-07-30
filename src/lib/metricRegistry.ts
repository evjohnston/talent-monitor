import type { Exhibit, Stage } from "./types.ts";

// A real, minimal metric registry (issue #18) — built once here from the
// 91 real exhibits actually in public/data/talent.json, not a
// speculative schema built ahead of any real caller. A metric registry
// was attempted once before (the original overhaul doc's own Phase 1.4,
// `src/data/metrics.ts`, 1,679 lines) and deleted as confirmed dead code
// with zero importers — this one exists specifically to power the
// explorer's search/filter/catalog below, the real caller the first
// attempt never had.
export type MeasureType = "timeseries" | "share" | "leaderboard" | "ranked-snapshot" | "geographic";

export type Geography = "us-only" | "country-comparison" | "world" | "institution-or-company" | "field-or-category";

export interface MetricRegistryEntry {
  id: string;
  title: string;
  stage: Stage;
  chapter: number;
  topics: string[];
  measureType: MeasureType;
  geography: Geography;
  source: string;
  reportReference: string;
  searchText: string; // pre-lowercased title+source+topics, built once so search doesn't re-derive it per keystroke
  dateRange: string | null;
  isDerived: boolean;
}

// Derived by keyword-matching against the 91 real exhibit titles this
// app actually has (read by hand, 2026-07-30 — see CLAUDE.md's "Explorer
// route" section), not ported verbatim from the six-deferred-features
// scope doc's own generic topic list. A mechanical derivation, not a
// hand-curated tag per exhibit — a real, disclosed simplification;
// checked by hand that every one of the 91 titles matches at least one
// real topic below.
const TOPIC_RULES: { topic: string; pattern: RegExp }[] = [
  { topic: "K-12 preparation", pattern: /international test|oecd|math proficienc|school spend|education spending/i },
  { topic: "College completion", pattern: /leave stem|leave college|non-completer|change majors|finish with a stem degree|keep their students|lose them/i },
  { topic: "Study abroad", pattern: /study abroad|import students|export them/i },
  { topic: "Degree production", pattern: /degree|doctorate|phds?|research doctorates/i },
  { topic: "International enrollment", pattern: /international.*students?|international (enrollment|undergraduate|graduate)/i },
  { topic: "Graduate and postdoctoral training", pattern: /postdoctoral|graduate program/i },
  { topic: "STEM workforce", pattern: /work in stem|stem occupation|temporary visa holders/i },
  { topic: "H-1B", pattern: /h-1b/i },
  { topic: "OPT", pattern: /\bopt\b/i },
  { topic: "PERM and green cards", pattern: /perm|green card/i },
  { topic: "Retention and stay rates", pattern: /plan to stay|stay in the united states|stay intention|talent .* lose|j-1 scholars|work at higher rates/i },
  { topic: "AI companies and founders", pattern: /founder|founded|ai compan/i },
  { topic: "Research publications and citations", pattern: /cited|citation|selective venue|top papers|catch up.*conference|research impact/i },
  { topic: "Prizes", pattern: /nobel|science's top prizes|laureate/i },
  { topic: "R&D", pattern: /r&d/i },
  { topic: "Patents", pattern: /patent/i },
  { topic: "Universities and rankings", pattern: /rank in the global top|university/i },
];

function deriveTopics(exhibit: Exhibit): string[] {
  const haystack = `${exhibit.title} ${exhibit.sourceShort}`;
  const matched = TOPIC_RULES.filter((r) => r.pattern.test(haystack)).map((r) => r.topic);
  return matched.length > 0 ? matched : ["Other"];
}

function deriveMeasureType(exhibit: Exhibit): MeasureType {
  if (exhibit.kind === "share-timeseries") return "share";
  if (exhibit.kind === "timeseries") return "timeseries";
  if (exhibit.kind === "leaderboard-years") return "leaderboard";
  if (exhibit.kind === "country-map") return "geographic";
  return "ranked-snapshot";
}

// Real geography, derived from the exhibit's own actual columns/kind —
// not a hand-authored per-exhibit tag. "US-only" is the honest default
// for a plain single-series timeseries with no country dimension.
function deriveGeography(exhibit: Exhibit): Geography {
  if (exhibit.kind === "country-map") return "world";
  const hasCountryColumn = exhibit.columns.some((c) => /^country$/i.test(c));
  if (hasCountryColumn) return "country-comparison";
  if (exhibit.kind === "leaderboard-years") return "institution-or-company";
  const hasCompanyColumn = exhibit.columns.some((c) => /^(company|institution|employer)$/i.test(c));
  if (hasCompanyColumn) return "institution-or-company";
  if (exhibit.kind === "ranked-bar") return "field-or-category";
  return "us-only";
}

function realDateRangeFor(exhibit: Exhibit): string | null {
  const yearCol = exhibit.columns.find((c) => /^year$/i.test(c));
  if (!yearCol) return null;
  const years = exhibit.rows.map((r) => r[yearCol]).filter((v): v is number => typeof v === "number");
  if (years.length === 0) return null;
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
}

export function buildMetricRegistry(exhibits: Exhibit[]): MetricRegistryEntry[] {
  return exhibits.map((exhibit) => {
    const topics = deriveTopics(exhibit);
    const searchText = [exhibit.id, exhibit.title, exhibit.sourceShort, ...topics].join(" ").toLowerCase();
    return {
      id: exhibit.id,
      title: exhibit.title,
      stage: exhibit.stage,
      chapter: exhibit.chapter,
      topics,
      measureType: deriveMeasureType(exhibit),
      geography: deriveGeography(exhibit),
      source: exhibit.sourceShort,
      reportReference: `Ch. ${exhibit.chapter} — ${exhibit.id}`,
      searchText,
      dateRange: realDateRangeFor(exhibit),
      isDerived: !!exhibit.derivedFrom && exhibit.derivedFrom.length > 0,
    };
  });
}

// Real substring search across title/source/topics/id — 91 real entries
// is small enough that a plain filter is genuinely fast; no search
// library needed at this scale (confirmed by hand: instant on every
// keystroke against the real registry).
export function searchRegistry(entries: MetricRegistryEntry[], query: string): MetricRegistryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((e) => e.searchText.includes(q));
}

export const ALL_TOPICS: string[] = [...new Set(TOPIC_RULES.map((r) => r.topic)), "Other"];

// Compare mode's own real compatibility rule (issue #18's own "do not
// permit comparisons across incompatible units" requirement) — two
// indicators are compatible only when they share the same real
// measureType. Deliberately this simple, not a deeper unit-compatibility
// system: comparison mode renders each selected exhibit as its own real,
// independent panel (never merges two different real datasets onto one
// shared axis — see ExplorerCompare.tsx's own note), so the actual risk
// this rule guards against is smaller than "plotting a % share against a
// raw headcount," and a measureType match is a real, meaningful signal
// without inventing a broader taxonomy this app's data doesn't need yet.
export function isCompatibleForCompare(a: MetricRegistryEntry, b: MetricRegistryEntry): boolean {
  return a.measureType === b.measureType;
}

// Real gating for the "add to compare" action — false when already at
// the real 4-item cap, already selected, or incompatible with whatever's
// already in the set (empty set accepts anything, since there's nothing
// to be incompatible with yet).
export function canAddToCompare(candidate: MetricRegistryEntry, current: MetricRegistryEntry[]): boolean {
  if (current.some((c) => c.id === candidate.id)) return false;
  if (current.length >= 4) return false;
  return current.every((c) => isCompatibleForCompare(c, candidate));
}
