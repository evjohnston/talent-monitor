import { describe, it, expect } from "vitest";
import { codeFromCountryName, countryName, countryColor, continentOf, countrySlug, codeFromCountrySlug } from "./countries.ts";

describe("codeFromCountryName", () => {
  it("resolves the report's own real country-name variants to the same code", () => {
    // docs/report-crosswalk-notes.md claimed "South Korea" (FIG203),
    // "Republic of Korea" (FIG410/TAB505), and "Korea" (FIG608) all
    // already resolved to the same code — writing this test found that
    // claim was only 2/3 true: i18n-iso-countries' own fuzzy matching
    // handles the first two, but not the bare word "Korea," which is
    // exactly what FIG608's real data uses. toCountryMapValues() silently
    // drops any row whose name doesn't resolve, so FIG608's world map was
    // missing South Korea's real data point entirely until
    // EXTRA_NAME_ALIASES (countries.ts) was added to fix it.
    expect(codeFromCountryName("South Korea")).toBe("KR");
    expect(codeFromCountryName("Republic of Korea")).toBe("KR");
    expect(codeFromCountryName("Korea")).toBe("KR");
  });

  it("resolves COMMON_NAME overrides case-insensitively", () => {
    expect(codeFromCountryName("China")).toBe("CN");
    expect(codeFromCountryName("china")).toBe("CN");
    expect(codeFromCountryName("United States")).toBe("US");
  });

  it("returns null for an empty or whitespace-only name, not a false match", () => {
    expect(codeFromCountryName("")).toBeNull();
    expect(codeFromCountryName("   ")).toBeNull();
  });

  it("returns null for a real non-country string rather than guessing", () => {
    expect(codeFromCountryName("Not a real country")).toBeNull();
  });
});

describe("countryName", () => {
  it("uses the COMMON_NAME override instead of the ISO formal name", () => {
    // The ISO short name for CN is "China" already, but CD's is "Congo,
    // the Democratic Republic of the" — exactly the case COMMON_NAME
    // exists to override.
    expect(countryName("CD")).toBe("DR Congo");
    expect(countryName("US")).toBe("United States");
  });

  it("falls back to the real ISO name for a country with no override", () => {
    expect(countryName("DE")).toBe("Germany");
  });

  it("returns \"Unknown\" for a null/undefined code, never a blank string", () => {
    expect(countryName(null)).toBe("Unknown");
    expect(countryName(undefined)).toBe("Unknown");
  });
});

describe("countryColor", () => {
  it("gives the 4 named actors their own fixed color", () => {
    expect(countryColor("US")).toBe("var(--country-us)");
    expect(countryColor("CN")).toBe("var(--country-cn)");
    expect(countryColor("IN")).toBe("var(--country-in)");
    expect(countryColor("DE")).toBe("var(--country-eu)"); // real EU member
  });

  it("gives every non-named country the same restrained neutral, not decorative variety", () => {
    expect(countryColor("KR")).toBe("var(--country-other)");
    expect(countryColor("GB")).toBe("var(--country-other)"); // real EU non-member (post-Brexit)
    expect(countryColor(null)).toBe("var(--country-other)");
  });
});

describe("continentOf", () => {
  it("returns a real continent for a known code", () => {
    expect(continentOf("US")).toBe("north-america");
    expect(continentOf("CN")).toBe("asia");
  });

  it("returns null for an unknown or missing code", () => {
    expect(continentOf(null)).toBeNull();
    expect(continentOf("ZZ")).toBeNull();
  });
});

describe("country profile slugs (issue #19)", () => {
  // The 9 initial country-profile countries, per docs/
  // CLAUDE_CODE_SIX_DEFERRED_FEATURES.md's locked scope — each slug must
  // round-trip back to the same real alpha-2 code, and match the issue's
  // own worked example ("india" -> /countries/india/).
  const PROFILE_COUNTRIES: [string, string][] = [
    ["US", "united-states"],
    ["CN", "china"],
    ["IN", "india"],
    ["GB", "united-kingdom"],
    ["DE", "germany"],
    ["KR", "south-korea"],
    ["JP", "japan"],
    ["CA", "canada"],
    ["AU", "australia"],
  ];

  it.each(PROFILE_COUNTRIES)("generates and round-trips the real slug for %s", (code, expectedSlug) => {
    expect(countrySlug(code)).toBe(expectedSlug);
    expect(codeFromCountrySlug(expectedSlug)).toBe(code);
  });

  it("returns null for a bogus slug rather than guessing", () => {
    expect(codeFromCountrySlug("not-a-real-country")).toBeNull();
  });

  it("has no slug collisions across the full real ISO country list", async () => {
    // A generic, mechanical slugifier (not a hand-typed table) risks two
    // different real countries colliding on the same slug — checked
    // against the full real ISO list, not just the 9 profile countries.
    const countries = (await import("i18n-iso-countries")).default;
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const code of Object.keys(countries.getAlpha2Codes())) {
      const slug = countrySlug(code);
      if (!slug) continue;
      if (seen.has(slug)) collisions.push(`${slug}: ${seen.get(slug)} vs ${code}`);
      seen.set(slug, code);
    }
    expect(collisions).toEqual([]);
  });

  it.each(["Republic of Korea", "South Korea", "Great Britain", "United States of America"])(
    "resolves the real report-data name form %s to a code with a valid slug",
    (name) => {
      const code = codeFromCountryName(name);
      expect(code).not.toBeNull();
      expect(countrySlug(code)).not.toBeNull();
    },
  );
});
