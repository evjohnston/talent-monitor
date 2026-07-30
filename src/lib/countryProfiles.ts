import type { Exhibit } from "./types.ts";
import { codeFromCountryName, countryName, countrySlug } from "./countries.ts";
import { buildMetricRegistry, type MetricRegistryEntry } from "./metricRegistry.ts";
import { toLatestValue, numericColumns } from "./exhibitData.ts";

// Country profiles (issue #19, sixth and last of the six deferred
// features) — real per-country pages assembled from report-supported
// data only. Per the source doc's own locked scope: 9 initial countries,
// route pattern /countries/<slug>/, no generic country essays, no
// inferred policy performance from missing indicators.

const isNum = (v: unknown): v is number => typeof v === "number";

function resolveCountryCode(raw: string): string | null {
  return /^[A-Z]{2}$/.test(raw) ? raw : codeFromCountryName(raw);
}

// A column HEADER resolves to a country beyond a literal country name in
// three real, hand-confirmed cases in this corpus (checked against every
// numeric column header across all 91 exhibits before adding any of
// these — see CLAUDE.md's "Country profiles" section):
//   - "China: EB1" / "India: EB1" (TAB605) — text before a real colon.
//   - "US_Count" / "CN_Share" (FIG504) — an UPPERCASE 2-letter prefix,
//     delimited by "_". Uppercase-only deliberately: a lowercase 2-letter
//     prefix risks matching an ordinary word fragment.
//   - "pct_papers_with_us" / "pct_papers_with_cn" (FIG503) — a lowercase
//     2-letter SUFFIX, delimited by "_". Lowercase-only deliberately: a
//     first attempt using a case-insensitive suffix match also caught
//     FIG511's "USD_PPP_BN" (a real unit suffix, "$ billions," not
//     Brunei) — the report's own real per-country suffixes are always
//     lowercase snake_case; its unit/acronym suffixes are always
//     uppercase. That case distinction is what keeps this real and
//     narrow rather than a generic (and therefore false-positive-prone)
//     token scan.
function resolveHeaderCountryCode(header: string): string | null {
  const whole = resolveCountryCode(header.trim());
  if (whole) return whole;
  const beforeColon = header.split(":")[0].trim();
  if (beforeColon !== header) {
    const code = resolveCountryCode(beforeColon);
    if (code) return code;
  }
  const prefixMatch = header.match(/^([A-Z]{2})_/);
  if (prefixMatch) {
    const code = resolveCountryCode(prefixMatch[1]);
    if (code) return code;
  }
  const suffixMatch = header.match(/_([a-z]{2})$/);
  if (suffixMatch) {
    const code = resolveCountryCode(suffixMatch[1].toUpperCase());
    if (code) return code;
  }
  return null;
}

// Real country coverage for one exhibit — every alpha-2 code with at
// least one real (non-null) numeric data point attributable to it,
// computed directly from the exhibit's own columns/rows. Same "derive
// from real data, don't hand-type a table that can drift" discipline
// metricRegistry.ts already established for topic/measureType/geography
// — checked by hand against every one of the 91 real exhibits (see
// CLAUDE.md) rather than assumed correct from the shape alone.
//
// Two real shapes, checked independently:
//   - "wide": a column HEADER is itself a country (FIG411's "China"/
//     "India" columns, TAB202's country-per-column parts, FIG503/504's
//     composite headers above) — every such numeric column with ≥1 real
//     value attributes to that country.
//   - "long": a non-numeric column's own VALUES are country names/codes
//     (FIG512's "Country" column, FIG410's "Year"-named entity column
//     which genuinely holds country names, not years) — every row whose
//     identity column resolves to a country AND has ≥1 real numeric
//     value elsewhere in that row attributes to that country.
// An exhibit with NO real country dimension at all (the large majority
// — 55 of 91) returns an empty set; see isImplicitlyDomestic() below for
// why that's treated as "about the United States," not "about nothing."
export function exhibitCountryCodes(exhibit: Exhibit): Set<string> {
  const codes = new Set<string>();
  const numCols = numericColumns(exhibit);
  if (numCols.length === 0) return codes;

  for (const col of numCols) {
    const code = resolveHeaderCountryCode(col);
    if (code && exhibit.rows.some((r) => isNum(r[col]))) codes.add(code);
  }

  const identityCols = exhibit.columns.filter((c) => !numCols.includes(c));
  for (const col of identityCols) {
    for (const row of exhibit.rows) {
      const raw = row[col];
      if (typeof raw !== "string") continue;
      const code = resolveCountryCode(raw);
      if (!code) continue;
      if (numCols.some((c) => isNum(row[c]))) codes.add(code);
    }
  }
  return codes;
}

// The country-specific value a summary or supporting-metric callout
// needs — NOT plain toLatestValue(exhibit), which defaults to whichever
// column happens to be numerically first and has no country context at
// all. A real, confirmed bug this caught: calling toLatestValue(FIG109)
// for both China's and India's profile returned the exact same number
// (FIG109's "China" column, since it's numericColumns()[0]) regardless
// of which country's profile was asking. Handles both real shapes
// exhibitCountryCodes() already distinguishes: a wide-format exhibit
// picks the column that resolves to this country (preferring a real
// observed column over a "(projected)" one when both exist, e.g.
// FIG109's "China" vs "China (projected)"); a long-format exhibit
// filters to the rows whose identity column resolves to this country
// before taking the latest real value.
export function countryLatestValue(exhibit: Exhibit, code: string): { x: string | number; value: number } | null {
  const numCols = numericColumns(exhibit);
  const xKey = exhibit.columns[0];

  const matchingCols = numCols.filter((c) => resolveHeaderCountryCode(c) === code);
  if (matchingCols.length > 0) {
    const preferred = matchingCols.find((c) => !/projected/i.test(c)) ?? matchingCols[0];
    return toLatestValue(exhibit, preferred);
  }

  const identityCols = exhibit.columns.filter((c) => !numCols.includes(c));
  const valueCol = numCols[0];
  if (!valueCol) return null;
  for (let i = exhibit.rows.length - 1; i >= 0; i--) {
    const row = exhibit.rows[i];
    const matchesCountry = identityCols.some((c) => {
      const raw = row[c];
      return typeof raw === "string" && resolveCountryCode(raw) === code;
    });
    if (matchesCountry && isNum(row[valueCol])) {
      return { x: (row[xKey] ?? "") as string | number, value: row[valueCol] as number };
    }
  }
  return null;
}

// This report is about the United States' own STEM talent pipeline — an
// exhibit with no explicit country dimension at all (a plain "Year ->
// doctorates awarded" series, say) is inherently about the US, not about
// nothing. Confirmed by hand across all 55 real exhibits this applies to
// (see CLAUDE.md) — every one is a US-domestic statistic (degree
// production, H-1B employers, OPT growth, etc.), never e.g. a world
// aggregate with no country breakdown.
export function isImplicitlyDomestic(exhibit: Exhibit): boolean {
  return exhibitCountryCodes(exhibit).size === 0;
}

export interface ProfileCountry {
  code: string;
  slug: string;
  name: string;
}

// The 9 initial countries, per the source doc's own locked scope —
// derived from countries.ts's existing real name/slug functions, not a
// second hand-typed name table.
export const PROFILE_COUNTRIES: ProfileCountry[] = (
  ["US", "CN", "IN", "GB", "DE", "KR", "JP", "CA", "AU"] as const
).map((code) => ({ code, slug: countrySlug(code)!, name: countryName(code) }));

// Staged rollout, per the roadmap's own PR sequence (framework -> US/
// China/India -> remaining 6 -> compare/downloads/polish) — real routes
// are only generated for a country once it's actually been hand-verified
// (see CLAUDE.md's "Country profiles" section for what each PR checked).
// Not a feature flag masking incomplete work: every enabled country's
// profile is fully real, exactly like every other route in this app.
export const ENABLED_PROFILE_CODES: readonly string[] = ["US", "CN", "IN"];

export function enabledProfileCountries(): ProfileCountry[] {
  return PROFILE_COUNTRIES.filter((c) => ENABLED_PROFILE_CODES.includes(c.code));
}

export type ProfileSectionId =
  | "talent-production"
  | "international-enrollment"
  | "workforce-and-founders"
  | "retention-and-immigration"
  | "research-output"
  | "patents-and-rd";

export const PROFILE_SECTIONS: { id: ProfileSectionId; label: string }[] = [
  { id: "talent-production", label: "Talent production" },
  { id: "international-enrollment", label: "International enrollment and training" },
  { id: "workforce-and-founders", label: "US workforce and founders" },
  { id: "retention-and-immigration", label: "Retention and immigration" },
  { id: "research-output", label: "Research output" },
  { id: "patents-and-rd", label: "Patents and R&D" },
];

// Maps each real topic metricRegistry.ts already derives (from the
// exhibit's own title/source, checked against all 91 real titles — see
// that file's own note) down into this page's smaller, curated section
// vocabulary. A topic not listed here ("Other" — confirmed 0 real
// exhibits fall into it) has no section and is simply never grouped.
const TOPIC_TO_SECTION: Record<string, ProfileSectionId> = {
  "K-12 preparation": "talent-production",
  "College completion": "talent-production",
  "Degree production": "talent-production",
  "International enrollment": "international-enrollment",
  "Study abroad": "international-enrollment",
  "Graduate and postdoctoral training": "international-enrollment",
  "STEM workforce": "workforce-and-founders",
  "AI companies and founders": "workforce-and-founders",
  "H-1B": "workforce-and-founders",
  OPT: "retention-and-immigration",
  "PERM and green cards": "retention-and-immigration",
  "Retention and stay rates": "retention-and-immigration",
  "Research publications and citations": "research-output",
  Prizes: "research-output",
  "Universities and rankings": "research-output",
  Patents: "patents-and-rd",
  "R&D": "patents-and-rd",
};

// Checked in this specific order, most-specific-topic-first, NOT in
// entry.topics' own array order (which is metricRegistry.ts's TOPIC_RULES
// declaration order, tuned for a different job — showing every relevant
// topic as a pill in the explorer). A real, confirmed bug taking
// entry.topics[0] naively: FIG601/602/608/609/TAB601/602 are all
// genuinely about retention, but their titles mention "PhD," which also
// matches "Degree production"'s broader /degree|doctorate|phds?/i
// pattern — a pattern that happens to sit earlier in TOPIC_RULES' own
// array, so it silently won the single-section pick and misfiled six
// real retention exhibits under "Talent production" before this fix.
const SECTION_PRIORITY: string[] = [
  "OPT",
  "PERM and green cards",
  "Retention and stay rates",
  "H-1B",
  "AI companies and founders",
  "STEM workforce",
  "Study abroad",
  "International enrollment",
  "Graduate and postdoctoral training",
  // "R&D"/"Patents" sit below graduate training deliberately: FIG208's
  // real citation ("Postdocs at Federally Funded R&D Centers") matches
  // metricRegistry.ts's broad /r&d/i pattern purely as a side effect of
  // its FUNDING SOURCE's name — the exhibit itself is about postdoctoral
  // positions, not R&D spending, and its title's own "postdoctoral" match
  // is the more correct signal.
  "Patents",
  "R&D",
  "Research publications and citations",
  "Prizes",
  "Universities and rankings",
  "K-12 preparation",
  "College completion",
  "Degree production",
];

function sectionFor(entry: MetricRegistryEntry): ProfileSectionId | null {
  for (const topic of SECTION_PRIORITY) {
    if (entry.topics.includes(topic)) {
      const section = TOPIC_TO_SECTION[topic];
      if (section) return section;
    }
  }
  return null;
}

// Whether ExhibitChart's real rendering for this exhibit can correctly
// highlight (or rank by) ONE specific country. SeriesChart and WorldMap
// both accept a real `emphasize` prop (already wired through
// ExhibitPanel); BarRow (the ranked-bar fallback) and LeaderboardYears do
// not — confirmed by reading ExhibitChart.tsx directly, not assumed.
// For most ranked-bar/leaderboard-years exhibits that's harmless (each
// row already carries its own real country in its label, e.g. FIG512's
// "China · Baidu" — a mixed ranking, just not highlighted). But a real,
// confirmed exception exists: FIG308 and FIG508 are WIDE-format
// ranked-bar exhibits (countries as separate columns, e.g. FIG508's
// "France, Germany, ..., China" columns with no shared "Country" identity
// column at all) — the generic toRankedBars() fallback ranks by
// whichever column happens to be LAST, which is silently wrong for every
// country's profile except whichever one that happens to be. Detected
// structurally (a numeric column header itself resolves to a country),
// not by exhibit id, in case a future data refresh introduces another
// exhibit with this same real shape.
export function isSafeAsCountryChart(exhibit: Exhibit): boolean {
  if (exhibit.kind !== "ranked-bar" && exhibit.kind !== "leaderboard-years") return true;
  const numCols = numericColumns(exhibit);
  return !numCols.some((c) => resolveHeaderCountryCode(c) !== null);
}

export interface ProfileSectionData {
  id: ProfileSectionId;
  label: string;
  exhibits: Exhibit[];
  isMissing: boolean; // true = this section applies in principle (other countries have real data here) but this country has none
}

export interface CountryProfileData {
  country: ProfileCountry;
  summary: string;
  indicatorCount: number;
  sections: ProfileSectionData[];
}

// Real, template-generated factual summaries only — never freeform text.
// The single primary exhibit is the country's own earliest-chapter
// eligible exhibit with a real latest value (report order, same
// tie-break metricRegistry's own sort already uses) — a deterministic,
// inspectable choice, not "the biggest number."
// A share-timeseries exhibit's own real values sometimes sit in a raw
// 0-1 fraction (needs ×100 to read as a percent) — same real range check
// ExhibitChart.tsx already applies to the full chart, reused here so a
// generated summary or supporting-metric callout never shows a bare
// "0.21" for what the exhibit's own chart renders as "21%."
export function formatIndicatorValue(exhibit: Exhibit, value: number): string {
  const isFraction = exhibit.kind === "share-timeseries" && Math.abs(value) <= 1.5;
  const scaled = isFraction ? value * 100 : value;
  const formatted = scaled.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return isFraction ? `${formatted}%` : formatted;
}

function buildSummary(country: ProfileCountry, eligible: { exhibit: Exhibit; entry: MetricRegistryEntry }[]): string {
  if (eligible.length === 0) {
    return `The report does not contain a comparable indicator series for ${country.name}.`;
  }
  const primary = [...eligible].sort((a, b) => a.entry.chapter - b.entry.chapter || a.entry.id.localeCompare(b.entry.id))[0];
  const latest = countryLatestValue(primary.exhibit, country.code) ?? toLatestValue(primary.exhibit);
  if (!latest) {
    return `${country.name} appears in ${eligible.length} of the report's real indicators.`;
  }
  const value = typeof latest.value === "number" ? formatIndicatorValue(primary.exhibit, latest.value) : String(latest.value);
  return `In ${latest.x}, ${country.name}'s value for "${primary.exhibit.title}" was ${value}. ${country.name} appears in ${eligible.length} of the report's real indicators overall.`;
}

// The one real per-country config this whole feature is built around —
// every profile's content is a pure function of the actual imported
// exhibit data (exhibitCountryCodes()/isImplicitlyDomestic() above) and
// the existing real topic registry, not a hand-authored 91xN grid that
// could silently drift from what's actually in talent.json.
export function buildCountryProfile(code: string, exhibits: Exhibit[]): CountryProfileData | null {
  const country = PROFILE_COUNTRIES.find((c) => c.code === code);
  if (!country) return null;

  const registry = buildMetricRegistry(exhibits);
  const registryById = new Map(registry.map((r) => [r.id, r]));

  const eligible = exhibits
    .filter((e) => exhibitCountryCodes(e).has(code) || (code === "US" && isImplicitlyDomestic(e)))
    .map((e) => ({ exhibit: e, entry: registryById.get(e.id)! }))
    .filter((x): x is { exhibit: Exhibit; entry: MetricRegistryEntry } => !!x.entry);

  // A section is "universal" when at least one OTHER real exhibit in it
  // has a genuine multi-country dimension (≥2 real countries) — i.e. the
  // report's own design collects this indicator cross-nationally, even
  // if this specific country happens to have none. A section populated
  // ONLY via the US's implicit-domestic bucket (e.g. H-1B employer data)
  // is inherently a US-specific measure, not a gap for anyone else — it
  // never appears, missing or otherwise, on a non-US profile.
  const universalSections = new Set<ProfileSectionId>();
  for (const e of exhibits) {
    const entry = registryById.get(e.id);
    if (!entry) continue;
    const section = sectionFor(entry);
    if (!section) continue;
    if (exhibitCountryCodes(e).size >= 2) universalSections.add(section);
  }

  const bySection = new Map<ProfileSectionId, Exhibit[]>();
  for (const { exhibit, entry } of eligible) {
    const section = sectionFor(entry);
    if (!section) continue;
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section)!.push(exhibit);
  }

  const sections: ProfileSectionData[] = [];
  for (const { id, label } of PROFILE_SECTIONS) {
    // Chart-safe exhibits sort first — CountryProfile.tsx renders
    // sectionExhibits[0] as the section's full-chart "primary," and an
    // exhibit that ExhibitChart can't actually highlight for THIS
    // country (see isSafeAsCountryChart above) must never win that slot
    // even if it has an earlier real chapter/id.
    const sectionExhibits = (bySection.get(id) ?? []).sort(
      (a, b) => Number(isSafeAsCountryChart(b)) - Number(isSafeAsCountryChart(a)) || a.chapter - b.chapter || a.id.localeCompare(b.id),
    );
    if (sectionExhibits.length > 0) {
      sections.push({ id, label, exhibits: sectionExhibits, isMissing: false });
    } else if (universalSections.has(id)) {
      sections.push({ id, label, exhibits: [], isMissing: true });
    }
    // else: a section that's inherently domestic-only and this isn't the
    // US (or that's genuinely empty for everyone) — omitted entirely,
    // not shown as a false "gap."
  }

  return {
    country,
    summary: buildSummary(country, eligible),
    indicatorCount: eligible.length,
    sections,
  };
}
