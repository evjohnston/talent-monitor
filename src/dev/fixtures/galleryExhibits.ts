import type { Exhibit } from "../../lib/types.ts";
import type { ChartAnnotation } from "../../lib/annotations.ts";

// Small, self-contained fixture data for the component gallery
// (src/pages/dev/components.astro) — real Exhibit objects, rendered
// through the real ExhibitPanel/ExhibitChart/MethodologyDrawer dispatch,
// not a mocked visual replica of any of them. Deliberately tiny row
// counts and no dependency on public/data/talent.json or any network
// fetch, per the gallery issue's own "no remote data" rule.

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024];

export const galleryTimeseriesSmall: Exhibit = {
  id: "GAL-TS-SMALL",
  stage: "foundation",
  chapter: 4,
  order: 0,
  title: "Fixture: a small timeseries (2 series)",
  kind: "timeseries",
  sourceShort: "Gallery fixture data",
  sourceLong: "Synthetic data for the internal component gallery — not a real report exhibit.",
  sourceUrls: [],
  columns: ["Year", "Reading", "Math"],
  rows: YEARS.map((y, i) => ({ Year: y, Reading: 10 + i * 1.4, Math: 6 - i * 0.6 })),
};

export const galleryTimeseriesManySeries: Exhibit = {
  id: "GAL-TS-MANY",
  stage: "foundation",
  chapter: 4,
  order: 1,
  title: "Fixture: a wide timeseries (9 series, triggers the series picker)",
  kind: "timeseries",
  sourceShort: "Gallery fixture data",
  sourceLong: "Synthetic data for the internal component gallery — exercises SeriesChart's MAX_SERIES_WITHOUT_PICKER threshold (6).",
  sourceUrls: ["https://example.org/fixture-a", "https://example.org/fixture-b"],
  columns: ["Year", "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India"],
  rows: YEARS.map((y, i) => ({
    Year: y,
    Alpha: 40 + i * 3,
    Bravo: 35 + i * 2.2,
    Charlie: 30 - i,
    Delta: 25 + i * 0.5,
    Echo: 20 + i * 1.8,
    Foxtrot: 18 - i * 0.3,
    Golf: 15 + i,
    Hotel: 12 + i * 0.7,
    India: 9 + i * 2.5, // fastest-growing — should win the "biggest most-recent value" default-6 selection
  })),
};

// A real null cell in the middle of a series — Nivo's own real behavior
// (a broken line segment) is what this documents, not an invented
// "missing data" visual treatment layered on top of it.
export const galleryTimeseriesMissingData: Exhibit = {
  id: "GAL-TS-MISSING",
  stage: "foundation",
  chapter: 4,
  order: 2,
  title: "Fixture: a timeseries with a real missing value",
  kind: "timeseries",
  sourceShort: "Gallery fixture data",
  sourceLong: "Synthetic data — the 2021 row's value is null, same as a real gap in a source series.",
  sourceUrls: [],
  columns: ["Year", "Series"],
  rows: YEARS.map((y, i) => ({ Year: y, Series: y === 2021 ? null : 10 + i })),
};

export const galleryShareTimeseries: Exhibit = {
  id: "GAL-SHARE",
  stage: "graduate-training",
  chapter: 3,
  order: 0,
  title: "Fixture: a share/percentage timeseries",
  kind: "share-timeseries",
  sourceShort: "Gallery fixture data",
  sourceLong: "Synthetic percentage-point data for the internal component gallery.",
  sourceUrls: [],
  columns: ["Year", "International share"],
  rows: YEARS.map((y, i) => ({ Year: y, "International share": 30 + i * 2 })),
};

// toLeaderboardYears() reads a real WIDE shape — one row per entity, a
// column PER YEAR (exhibit.columns[0] is the entity name, the rest are
// 4-digit-year columns) — same real shape FIG302's own CSV export uses,
// not a long "one row per year+entity" shape.
const LB_NAMES = ["Northwind Robotics", "Contoso Semiconductor", "Fabrikam Biotech", "A Very Long Fictional Employer Name That Should Wrap Or Truncate Gracefully LLC"];
export const galleryLeaderboardYears: Exhibit = {
  id: "GAL-LB",
  stage: "workforce-entry",
  chapter: 4,
  order: 0,
  title: "Fixture: an entity x year leaderboard",
  kind: "leaderboard-years",
  sourceShort: "Gallery fixture data",
  sourceLong: "Synthetic employer-approval counts by year for the internal component gallery.",
  sourceUrls: [],
  columns: ["Company", ...YEARS.map(String)],
  rows: LB_NAMES.map((name, j) => ({
    Company: name,
    ...Object.fromEntries(YEARS.map((y) => [String(y), 500 - j * 80 + (y - 2018) * 10])),
  })),
};

export const galleryRankedBar: Exhibit = {
  id: "GAL-BAR",
  stage: "research-output",
  chapter: 6,
  order: 0,
  title: "Fixture: a ranked-bar snapshot",
  kind: "ranked-bar",
  sourceShort: "Gallery fixture data",
  sourceLong: "Synthetic single-year ranking for the internal component gallery.",
  sourceUrls: [],
  columns: ["Country", "Category", "Value"],
  rows: [
    { Country: "United States", Category: "Alpha", Value: 420 },
    { Country: "China", Category: "Alpha", Value: 380 },
    { Country: "India", Category: "Alpha", Value: 210 },
    { Country: "Germany", Category: "Alpha", Value: 150 },
    { Country: "A Country With An Unusually Long Display Name", Category: "Alpha", Value: 90 },
  ],
};

export const galleryCountryMapCount: Exhibit = {
  id: "GAL-MAP-COUNT",
  stage: "workforce-entry",
  chapter: 4,
  order: 1,
  title: "Fixture: a country map, count mode (zero-floored, sqrt-compressed)",
  kind: "country-map",
  sourceShort: "Gallery fixture data",
  sourceLong: "Synthetic zero-floored counts by country for the internal component gallery.",
  sourceUrls: [],
  columns: ["Country", "Count"],
  rows: [
    { Country: "United States", Count: 900 },
    { Country: "China", Count: 240 },
    { Country: "India", Count: 610 },
    { Country: "Germany", Count: 40 },
    { Country: "Canada", Count: 22 },
  ],
};

export const galleryCountryMapRange: Exhibit = {
  id: "GAL-MAP-RANGE",
  stage: "foundation",
  chapter: 4,
  order: 2,
  title: "Fixture: a country map, range mode (linear, can go negative)",
  kind: "country-map",
  sourceShort: "Gallery fixture data",
  sourceLong: "Synthetic score-gap data (can be negative) for the internal component gallery.",
  sourceUrls: [],
  columns: ["Country", "Score gap"],
  rows: [
    { Country: "United States", "Score gap": -7 },
    { Country: "China", "Score gap": 12 },
    { Country: "India", "Score gap": -18 },
    { Country: "Germany", "Score gap": 4 },
  ],
};

// Deliberately long real-shaped title/citation/URL list — documents how
// the shared components handle overflow rather than asserting they do.
export const galleryLongTitleAndCitation: Exhibit = {
  id: "GAL-LONG",
  stage: "retention-immigration",
  chapter: 5,
  order: 0,
  title: "Fixture: a deliberately long exhibit title that runs well past a normal panel's single-line heading width, to check real wrapping behavior",
  kind: "ranked-bar",
  sourceShort: "A Gallery Fixture Source Organization With An Unusually Long Name (2018, 2020, 2024)",
  sourceLong:
    "This is a deliberately long source citation, written the way a real multi-clause citation with several nested parenthetical years and a long institutional name actually reads, so the methodology drawer's own text wrapping and line-height can be checked against real content instead of a short placeholder sentence.",
  sourceUrls: ["https://example.org/a-fixture-source-with-a-long-path/documentation/dataset/2024-release", "https://example.org/second-source"],
  columns: ["Institution", "Value"],
  rows: [
    { Institution: "A University With A Genuinely Long Official Name For This Purpose", Value: 55 },
    { Institution: "Short U", Value: 40 },
  ],
};

// A real derived-exhibit example (mirrors FIG303's own derivedFrom/
// calculationNote shape) so MethodologyDrawer's "Computed by this site"
// row has something real to render in the gallery.
export const galleryDerivedExhibit: Exhibit = {
  ...galleryRankedBar,
  id: "GAL-DERIVED",
  order: 1,
  title: "Fixture: a derived exhibit (Computed-by-this-site methodology row)",
  derivedFrom: ["GAL-BAR"],
  calculationNote: "Computed by this gallery fixture, not a real report figure — top-N share of GAL-BAR's own values.",
  dataNote: "A real data-quality note would appear here, same as FIG101's estimate/confirmed year mix.",
};

export const GALLERY_EXHIBITS: Exhibit[] = [
  galleryTimeseriesSmall,
  galleryTimeseriesManySeries,
  galleryTimeseriesMissingData,
  galleryShareTimeseries,
  galleryLeaderboardYears,
  galleryRankedBar,
  galleryCountryMapCount,
  galleryCountryMapRange,
  galleryLongTitleAndCitation,
  galleryDerivedExhibit,
];

// A tiny Sankey fixture — Sankey.tsx isn't dispatched through
// ExhibitChart (it's called directly by Overview.tsx/TrackRetentionImmigration.tsx
// via sankeyData.ts), so it needs its own small nodes/links fixture here.
export const gallerySankeyFixture = {
  nodes: [
    { id: "a", label: "Domestic", detail: "100 units" },
    { id: "b", label: "International", detail: "40 units" },
    { id: "c", label: "Bachelor's", detail: "80 units" },
    { id: "d", label: "Master's", detail: "60 units" },
  ],
  links: [
    { source: "a", target: "c", value: 60 },
    { source: "a", target: "d", value: 40 },
    { source: "b", target: "c", value: 20 },
    { source: "b", target: "d", value: 20 },
  ],
};

// A dedicated fixture exhibit for the annotation example — deliberately
// not galleryTimeseriesSmall, which the "chart components" section above
// already renders under its own data-exhibit-id; reusing it here too
// would give two elements the same data-exhibit-id on one page.
export const galleryTimeseriesForAnnotations: Exhibit = {
  id: "GAL-TS-ANNOTATED",
  stage: "foundation",
  chapter: 4,
  order: 3,
  title: "Fixture: a timeseries with real annotation markers",
  kind: "timeseries",
  sourceShort: "Gallery fixture data",
  sourceLong: "Synthetic data for the internal component gallery.",
  sourceUrls: [],
  columns: ["Year", "Series"],
  rows: YEARS.map((y, i) => ({ Year: y, Series: 10 + i * 2 })),
};

// Two real annotation shapes (issue #15) against
// galleryTimeseriesForAnnotations' own real year range (2018-2024) — a
// high-priority one shown by default, a lower-priority one hidden behind
// the "Annotations (N)" toggle, same real distinction FIG409 (always-on)
// and FIG606 (opt-in) demonstrate on real pages.
export const galleryAnnotations: ChartAnnotation[] = [
  {
    id: "gal-annotation-event",
    exhibitIds: ["GAL-TS-ANNOTATED"],
    stage: "foundation",
    type: "event",
    start: 2020,
    label: "Fixture event annotation",
    shortLabel: "Fixture event",
    detail: "A fixture event annotation, shown by default (priority 1) — this is where a real one would explain what changed in 2020.",
    priority: 1,
    showByDefault: true,
  },
  {
    id: "gal-annotation-hidden",
    exhibitIds: ["GAL-TS-ANNOTATED"],
    stage: "foundation",
    type: "custom",
    start: 2022,
    label: "Fixture lower-priority annotation",
    shortLabel: "Fixture (hidden by default)",
    detail: "A fixture priority-2 annotation, hidden until \"Annotations\" is clicked — same real behavior as FIG606's own PERM-expiration annotation.",
    priority: 2,
    showByDefault: false,
  },
];
