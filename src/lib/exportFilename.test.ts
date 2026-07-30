import { describe, it, expect } from "vitest";
import { slugify, buildExportFilename } from "./exportFilename.ts";
import type { Exhibit } from "./types.ts";

function fixture(overrides: Partial<Exhibit> = {}): Exhibit {
  return {
    id: "FIG101",
    stage: "degree-production",
    chapter: 1,
    order: 1,
    title: "How Many Research Doctorates Are Awarded by U.S. Universities?",
    kind: "timeseries",
    sourceShort: "Test",
    sourceLong: "Test",
    sourceUrls: [],
    columns: ["Year", "Value"],
    rows: [{ Year: 1900, Value: 1 }, { Year: 2024, Value: 2 }],
    ...overrides,
  };
}

describe("slugify", () => {
  it("lowercases, strips punctuation, and hyphenates a real title", () => {
    expect(slugify("How Many Research Doctorates Are Awarded by U.S. Universities?")).toBe(
      "how-many-research-doctorates-are-awarded-by-u-s-universities"
    );
  });

  it("drops an apostrophe rather than replacing it with a hyphen", () => {
    expect(slugify("What Share of Degrees Awarded Are in STEM Fields?")).not.toContain("--");
    expect(slugify("Who's Ahead Globally")).toBe("whos-ahead-globally");
  });

  it("has no leading or trailing hyphens", () => {
    expect(slugify("Test?")).toBe("test");
    expect(slugify("?Test")).toBe("test");
  });
});

describe("buildExportFilename", () => {
  it("builds stage_slug_dateRange with a plain hyphen, not an en dash", () => {
    const e = fixture();
    expect(buildExportFilename(e, "csv")).toBe(
      "degree-production_how-many-research-doctorates-are-awarded-by-u-s-universities_1900-2024.csv"
    );
  });

  it("omits the date range when the exhibit has no real Year column", () => {
    const e = fixture({ columns: ["Country", "Value"], rows: [{ Country: "US", Value: 1 }], title: "A Snapshot" });
    expect(buildExportFilename(e, "csv")).toBe("degree-production_a-snapshot.csv");
  });
});
