import { describe, it, expect } from "vitest";
import { buildCountryProfile, exhibitCountryCodes, isImplicitlyDomestic, isSafeAsCountryChart, PROFILE_COUNTRIES } from "./countryProfiles.ts";
import type { Exhibit } from "./types.ts";

function fixture(overrides: Partial<Exhibit> = {}): Exhibit {
  return {
    id: "TEST1",
    stage: "degree-production",
    chapter: 1,
    order: 0,
    title: "How Many Research Doctorates Are Awarded by U.S. Universities?",
    kind: "timeseries",
    sourceShort: "NCES",
    sourceLong: "NCES, long form",
    sourceUrls: [],
    columns: ["Year", "Doctorates"],
    rows: [{ Year: 2023, Doctorates: 100 }, { Year: 2024, Doctorates: 110 }],
    ...overrides,
  };
}

describe("exhibitCountryCodes", () => {
  it("resolves a real country-name identity column (long format)", () => {
    const exhibit = fixture({
      kind: "country-map",
      columns: ["Country", "Value"],
      rows: [{ Country: "China", Value: 1 }, { Country: "India", Value: 2 }],
    });
    expect(exhibitCountryCodes(exhibit)).toEqual(new Set(["CN", "IN"]));
  });

  it("resolves real country-name column HEADERS (wide format)", () => {
    const exhibit = fixture({
      columns: ["Year", "China", "India"],
      rows: [{ Year: 2020, China: 10, India: 20 }],
    });
    expect(exhibitCountryCodes(exhibit)).toEqual(new Set(["CN", "IN"]));
  });

  it("resolves the real report's own composite headers (FIG503/504-style)", () => {
    const exhibit = fixture({
      columns: ["Year", "US_Count", "CN_Share", "pct_papers_with_us"],
      rows: [{ Year: 2020, US_Count: 10, CN_Share: 0.2, pct_papers_with_us: 0.3 }],
    });
    expect(exhibitCountryCodes(exhibit)).toEqual(new Set(["US", "CN"]));
  });

  it("resolves the real report's own colon-prefixed headers (TAB605-style)", () => {
    const exhibit = fixture({
      columns: ["Year", "China: EB1", "India: EB1"],
      rows: [{ Year: 2020, "China: EB1": 10, "India: EB1": 5 }],
    });
    expect(exhibitCountryCodes(exhibit)).toEqual(new Set(["CN", "IN"]));
  });

  it("does not mistake a real unit/acronym suffix for a country code", () => {
    // FIG511's real "USD_PPP_BN" column — a genuine regression check: an
    // earlier, case-insensitive suffix match caught this as "BN"
    // (Brunei), which is wrong; the real per-country suffix convention in
    // this report's data is always lowercase.
    const exhibit = fixture({
      columns: ["Year", "USD_PPP_BN"],
      rows: [{ Year: 2020, USD_PPP_BN: 5.2 }],
    });
    expect(exhibitCountryCodes(exhibit)).toEqual(new Set());
  });

  it("does not attribute a country from a row with no real numeric value", () => {
    const exhibit = fixture({
      kind: "country-map",
      columns: ["Country", "Value"],
      rows: [{ Country: "China", Value: null }],
    });
    expect(exhibitCountryCodes(exhibit)).toEqual(new Set());
  });

  it("returns an empty set for a plain US-domestic exhibit with no country dimension", () => {
    expect(exhibitCountryCodes(fixture())).toEqual(new Set());
  });
});

describe("isImplicitlyDomestic", () => {
  it("is true for an exhibit with no real country dimension", () => {
    expect(isImplicitlyDomestic(fixture())).toBe(true);
  });

  it("is false once a real country dimension exists", () => {
    const exhibit = fixture({ columns: ["Year", "China"], rows: [{ Year: 2020, China: 5 }] });
    expect(isImplicitlyDomestic(exhibit)).toBe(false);
  });
});

describe("isSafeAsCountryChart", () => {
  it("is true for timeseries/share-timeseries/country-map — ExhibitChart's SeriesChart and WorldMap both support real per-country emphasis", () => {
    expect(isSafeAsCountryChart(fixture({ kind: "timeseries" }))).toBe(true);
    expect(isSafeAsCountryChart(fixture({ kind: "share-timeseries" }))).toBe(true);
    expect(isSafeAsCountryChart(fixture({ kind: "country-map", columns: ["Country", "Value"], rows: [{ Country: "China", Value: 1 }] }))).toBe(true);
  });

  it("is false for a real wide-format ranked-bar exhibit (FIG508-style: countries as columns, no shared identity column)", () => {
    // BarRow has no per-country emphasis at all, and the generic
    // toRankedBars() fallback ranks by whichever column is LAST — for
    // this shape that's silently wrong for every country's profile
    // except whichever one happens to be positioned last.
    const exhibit = fixture({
      kind: "ranked-bar",
      columns: ["Year", "Germany", "China"],
      rows: [{ Year: 2020, Germany: 100, China: 200 }],
    });
    expect(isSafeAsCountryChart(exhibit)).toBe(false);
  });

  it("is true for a long-format ranked-bar exhibit with its own explicit Country identity column", () => {
    const exhibit = fixture({
      kind: "ranked-bar",
      columns: ["Country", "Company", "mean"],
      rows: [{ Country: "China", Company: "Baidu", mean: 500 }],
    });
    expect(isSafeAsCountryChart(exhibit)).toBe(true);
  });
});

describe("PROFILE_COUNTRIES", () => {
  it("has exactly the 9 real countries locked by the source scope doc, each with a real slug", () => {
    expect(PROFILE_COUNTRIES.map((c) => c.code)).toEqual(["US", "CN", "IN", "GB", "DE", "KR", "JP", "CA", "AU"]);
    for (const c of PROFILE_COUNTRIES) {
      expect(c.slug).toBeTruthy();
      expect(c.name).not.toBe("Unknown");
    }
  });
});

describe("buildCountryProfile", () => {
  it("returns null for a country outside the 9 real profile countries", () => {
    expect(buildCountryProfile("ZZ", [fixture()])).toBeNull();
  });

  it("groups a plain US-domestic exhibit under the US profile via implicit-domestic inclusion", () => {
    const profile = buildCountryProfile("US", [fixture()]);
    expect(profile).not.toBeNull();
    expect(profile!.indicatorCount).toBe(1);
    const section = profile!.sections.find((s) => s.id === "talent-production");
    expect(section?.exhibits.map((e) => e.id)).toEqual(["TEST1"]);
  });

  it("does not group a plain US-domestic exhibit under a non-US profile", () => {
    const profile = buildCountryProfile("CN", [fixture()]);
    expect(profile!.indicatorCount).toBe(0);
  });

  it("classifies a real retention exhibit under retention-and-immigration, not talent-production, despite its title mentioning PhDs", () => {
    // Regression: FIG601-style titles ("Do International PhD Recipients
    // Plan to Stay in the United States?") match BOTH "Degree production"
    // (the word "PhD") and "Retention and stay rates" (the phrase "plan
    // to stay") — the retention signal must win.
    const exhibit = fixture({
      id: "FIG601",
      title: "Do International PhD Recipients Plan to Stay in the United States?",
    });
    const profile = buildCountryProfile("US", [exhibit]);
    const section = profile!.sections.find((s) => s.id === "retention-and-immigration");
    expect(section?.exhibits.map((e) => e.id)).toEqual(["FIG601"]);
    expect(profile!.sections.find((s) => s.id === "talent-production")).toBeUndefined();
  });

  it("classifies a real postdoc exhibit under international enrollment, not R&D, despite its citation mentioning R&D centers", () => {
    // Regression: FIG208's real sourceShort ("Postdocs at Federally
    // Funded R&D Centers") matches the broad /r&d/i topic pattern purely
    // because of its funding source's name — the title's own
    // "postdoctoral" match is the correct signal.
    const exhibit = fixture({
      id: "FIG208",
      title: "Who Holds Postdoctoral Positions at Federally Funded Research Centers?",
      sourceShort: "NCSES, Postdocs at Federally Funded R&D Centers, 2010-2023.",
    });
    const profile = buildCountryProfile("US", [exhibit]);
    const section = profile!.sections.find((s) => s.id === "international-enrollment");
    expect(section?.exhibits.map((e) => e.id)).toEqual(["FIG208"]);
    expect(profile!.sections.find((s) => s.id === "patents-and-rd")).toBeUndefined();
  });

  it("flags a universal section as missing (not silently omitted) when this specific country has no real data there", () => {
    // "Patents and R&D" is universal because a second, real multi-country
    // exhibit exists — a country with no eligible exhibit of its own gets
    // an explicit missing-data notice, not silent disappearance.
    const usPatents = fixture({ id: "US_PATENTS", title: "Which Companies Lead in Patents?", kind: "ranked-bar", columns: ["Country", "Patents"], rows: [{ Country: "United States", Patents: 100 }, { Country: "Germany", Patents: 50 }] });
    const profile = buildCountryProfile("CN", [usPatents]);
    const section = profile!.sections.find((s) => s.id === "patents-and-rd");
    expect(section).toBeDefined();
    expect(section!.isMissing).toBe(true);
    expect(section!.exhibits).toEqual([]);
  });

  it("sorts a section's exhibits chart-safe-first, so an unsafe wide-format ranked-bar exhibit never wins the primary-chart slot", () => {
    // Regression: FIG508 ("Who Spends the Most on R&D?", a real wide-
    // format ranked-bar exhibit) was picked as the China profile's own
    // Patents-and-R&D PRIMARY chart purely by chapter/id tie-break —
    // its rendered ranking silently used whichever country's column
    // happened to be last, not China's. A real, lower-chapter but
    // chart-safe exhibit must now sort ahead of it even though FIG508's
    // own chapter/id would otherwise win.
    const unsafe = fixture({
      id: "FIG508",
      chapter: 5,
      title: "Who Spends the Most on R&D?",
      kind: "ranked-bar",
      columns: ["Year", "Germany", "China"],
      rows: [{ Year: 2020, Germany: 100, China: 200 }],
    });
    const safe = fixture({
      id: "FIG509",
      chapter: 5,
      title: "How Has R&D Intensity Changed?",
      kind: "timeseries",
      columns: ["Year", "China"],
      rows: [{ Year: 2020, China: 2.5 }],
    });
    const profile = buildCountryProfile("CN", [unsafe, safe]);
    const section = profile!.sections.find((s) => s.id === "patents-and-rd");
    expect(section!.exhibits[0].id).toBe("FIG509");
  });

  it("never shows a US-only-natured section (no real multi-country exhibit at all) as missing for a non-US country", () => {
    const profile = buildCountryProfile("CN", [fixture()]); // a plain US-domestic exhibit, no country dimension anywhere
    expect(profile!.sections.find((s) => s.id === "talent-production")).toBeUndefined();
  });

  it("generates a real, template-based summary citing an actual value, year, and title — never freeform text", () => {
    const profile = buildCountryProfile("US", [fixture()]);
    expect(profile!.summary).toContain("2024");
    expect(profile!.summary).toContain("110");
    expect(profile!.summary).toContain(fixture().title);
  });

  it("states plainly when the report has no comparable indicator for a country, rather than fabricating one", () => {
    const profile = buildCountryProfile("AU", [fixture()]);
    expect(profile!.summary).toContain("does not contain a comparable indicator series");
  });

  it("picks the RIGHT country's own value from a real multi-country wide-format exhibit, not whichever column comes first", () => {
    // Regression: a first version called plain toLatestValue(exhibit),
    // which has no country context and defaults to numericColumns()[0]
    // — China's and India's summaries both showed China's own number
    // (FIG109-style: "China" is literally the first numeric column)
    // until this was caught by hand comparing the two real summaries.
    const exhibit = fixture({
      id: "FIG109",
      title: "Who Will Produce the Most STEM PhDs?",
      columns: ["Year", "China", "India"],
      rows: [{ Year: 2020, China: 43399, India: 16968 }],
    });
    const cn = buildCountryProfile("CN", [exhibit]);
    const inp = buildCountryProfile("IN", [exhibit]);
    expect(cn!.summary).toContain("43,399");
    expect(inp!.summary).toContain("16,968");
    expect(cn!.summary).not.toContain("16,968");
    expect(inp!.summary).not.toContain("43,399");
  });

  it("prefers a real observed column over a same-country '(projected)' one when both exist", () => {
    const exhibit = fixture({
      id: "FIG109",
      title: "Who Will Produce the Most STEM PhDs?",
      columns: ["Year", "China", "China (projected)"],
      rows: [
        { Year: 2020, China: 43399, "China (projected)": null },
        { Year: 2050, China: null, "China (projected)": 118382 },
      ],
    });
    const profile = buildCountryProfile("CN", [exhibit]);
    expect(profile!.summary).toContain("43,399");
    expect(profile!.summary).not.toContain("118,382");
  });

  it("picks the right country's own value from a real long-format (row-per-country) exhibit", () => {
    const exhibit = fixture({
      id: "FIG512",
      title: "How Skewed Are AI Research Citation Counts by Company?",
      kind: "ranked-bar",
      columns: ["Country", "Company", "mean"],
      rows: [{ Country: "China", Company: "Baidu", mean: 500 }, { Country: "United States", Company: "OpenAI", mean: 4110 }],
    });
    const cn = buildCountryProfile("CN", [exhibit]);
    const us = buildCountryProfile("US", [exhibit]);
    expect(cn!.summary).toContain("500");
    expect(us!.summary).toContain("4,110");
  });
});
