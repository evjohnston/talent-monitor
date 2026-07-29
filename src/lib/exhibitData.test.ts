import { describe, it, expect } from "vitest";
import {
  numericColumns,
  toSeriesChart,
  toLatestValue,
  toCountryMapValues,
  toLeaderboardYears,
  toRankedBars,
  toDistributionStats,
  isRateShapedSeries,
} from "./exhibitData.ts";
import type { Exhibit } from "./types.ts";

// Minimal real-shaped fixture — only columns/rows matter to every function
// under test here, but the rest of the fields are real Exhibit fields, not
// stubbed with `as any`, so a future required-field change here fails this
// test file instead of silently type-checking around it.
function fixture(columns: string[], rows: Record<string, string | number | null>[]): Exhibit {
  return {
    id: "TESTFIG",
    stage: "foundation",
    chapter: 1,
    order: 1,
    title: "Test exhibit",
    kind: "timeseries",
    sourceShort: "Test source",
    sourceLong: "Test source, long form",
    sourceUrls: [],
    columns,
    rows,
  };
}

describe("numericColumns", () => {
  it("excludes the leading (x-axis) column even when it's numeric", () => {
    const e = fixture(["Year", "Value"], [{ Year: 2020, Value: 5 }]);
    expect(numericColumns(e)).toEqual(["Value"]);
  });

  it("excludes an annotation/text column with no real numeric value in any row", () => {
    const e = fixture(
      ["Year", "Value", "Estimate"],
      [{ Year: 2020, Value: 5, Estimate: "confirmed" }]
    );
    expect(numericColumns(e)).toEqual(["Value"]);
  });

  it("includes a column that's numeric in at least one row, even if null elsewhere", () => {
    const e = fixture(
      ["Year", "Value"],
      [{ Year: 2020, Value: null }, { Year: 2021, Value: 5 }]
    );
    expect(numericColumns(e)).toEqual(["Value"]);
  });
});

describe("toSeriesChart", () => {
  it("reads the first column as x and every other numeric column as its own series", () => {
    const e = fixture(
      ["Year", "Bachelors", "Masters"],
      [{ Year: 2020, Bachelors: 100, Masters: 50 }, { Year: 2021, Bachelors: 110, Masters: 55 }]
    );
    const { x, series } = toSeriesChart(e);
    expect(x).toEqual([2020, 2021]);
    expect(series).toEqual([
      { key: "Bachelors", label: "Bachelors", values: [100, 110] },
      { key: "Masters", label: "Masters", values: [50, 55] },
    ]);
  });

  it("keeps a real null as a gap, not a coerced zero", () => {
    const e = fixture(["Year", "Value"], [{ Year: 2020, Value: null }, { Year: 2021, Value: 5 }]);
    expect(toSeriesChart(e).series[0].values).toEqual([null, 5]);
  });
});

describe("toLatestValue", () => {
  it("returns the most recent non-null value, not just the last row", () => {
    const e = fixture(
      ["Year", "Value"],
      [{ Year: 2020, Value: 10 }, { Year: 2021, Value: 20 }, { Year: 2022, Value: null }]
    );
    expect(toLatestValue(e)).toEqual({ x: 2021, value: 20 });
  });

  it("defaults to the first real-numeric column when none is named", () => {
    const e = fixture(["Year", "A", "B"], [{ Year: 2020, A: 1, B: 2 }]);
    expect(toLatestValue(e)?.value).toBe(1);
  });

  it("returns null when the named column has no real values at all", () => {
    const e = fixture(["Year", "Value"], [{ Year: 2020, Value: null }]);
    expect(toLatestValue(e, "Value")).toBeNull();
  });
});

describe("toCountryMapValues", () => {
  it("resolves real country names to alpha-2 codes, dropping rows that don't resolve", () => {
    const e = fixture(
      ["Country", "Score"],
      [{ Country: "South Korea", Score: 500 }, { Country: "Not a real country", Score: 999 }]
    );
    const result = toCountryMapValues(e);
    expect(result?.values).toEqual({ KR: 500 });
  });

  it("normalizes real country-name variants for the same country to the same code", () => {
    // The exact cross-source inconsistency docs/report-crosswalk-notes.md
    // documents: "South Korea" vs "Republic of Korea" vs "Korea."
    const e = fixture(["Country", "Value"], [{ Country: "Republic of Korea", Value: 1 }]);
    expect(toCountryMapValues(e)?.values).toEqual({ KR: 1 });
  });
});

describe("toLeaderboardYears", () => {
  it("picks out real 4-digit-header columns as years, ignoring non-year columns", () => {
    const e = fixture(
      ["Company", "Country", "2020", "2021", "Notes"],
      [{ Company: "Acme", Country: "US", "2020": 10, "2021": 20, Notes: "x" }]
    );
    const { years, rows } = toLeaderboardYears(e);
    expect(years).toEqual(["2020", "2021"]);
    expect(rows).toEqual([{ name: "Acme", country: "US", valuesByYear: { "2020": 10, "2021": 20 } }]);
  });
});

describe("toRankedBars", () => {
  it("ranks by the LAST real-numeric column (most recent year), not the first", () => {
    const e = fixture(
      ["Company", "2005", "2025"],
      [{ Company: "A", "2005": 100, "2025": 10 }, { Company: "B", "2005": 10, "2025": 100 }]
    );
    const result = toRankedBars(e);
    expect(result?.rows.map((r) => r.label)).toEqual(["B", "A"]);
  });

  it('dedupes an adjacent identical label part instead of reading "colt · colt"', () => {
    // The exact real shape TAB501 has: a display name column immediately
    // followed by its own lowercased/normalized copy.
    const e = fixture(
      ["conf_norm", "conference", "share"],
      [{ conf_norm: "colt", conference: "colt", share: 0.5 }]
    );
    expect(toRankedBars(e)?.rows[0].label).toBe("colt");
  });

  it("joins genuinely different leading columns into one composite label", () => {
    const e = fixture(
      ["Country", "Company", "Value"],
      [{ Country: "US", Company: "Acme", Value: 5 }]
    );
    expect(toRankedBars(e)?.rows[0].label).toBe("US · Acme");
  });

  it("drops a row whose ranking column is null", () => {
    const e = fixture(["Company", "Value"], [{ Company: "A", Value: 5 }, { Company: "B", Value: null }]);
    expect(toRankedBars(e)?.rows.map((r) => r.label)).toEqual(["A"]);
  });

  it("truncates past topN and reports the real truncated count", () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({ Company: `C${i}`, Value: i }));
    const e = fixture(["Company", "Value"], rows);
    const result = toRankedBars(e, 12);
    expect(result?.rows.length).toBe(12);
    expect(result?.truncated).toBe(3);
  });
});

describe("isRateShapedSeries", () => {
  it("treats a real rate/share/percent-named column within [-1.5, 1.5] as rate-shaped", () => {
    expect(isRateShapedSeries({ key: "Approval Rate", label: "Approval Rate", values: [0.94, 0.87] })).toBe(true);
    expect(isRateShapedSeries({ key: "US_Share", label: "US_Share", values: [0.3, 0.5] })).toBe(true);
    expect(isRateShapedSeries({ key: "Percent Asia", label: "Percent Asia", values: [0.6] })).toBe(true);
  });

  it('does NOT match "doctorates" via the unanchored substring "rate"', () => {
    // Real bug caught by hand: an early version of this check used
    // /rate|percent|share/i with no word boundary, which matched
    // "doctorates" (docto-RATE-s) and wrongly split FIG301's real 0-1
    // share-of-degrees-by-origin columns into a bogus 2-vs-6 split.
    expect(isRateShapedSeries({ key: "U.S.-born: doctorates", label: "U.S.-born: doctorates", values: [0.52, 0.55] })).toBe(false);
  });

  it("does NOT treat a genuine small count as rate-shaped just because it's under 1.5", () => {
    // TAB404's real "Antarctica" study-abroad count — a real bug in an
    // earlier magnitude-only version of this check.
    expect(isRateShapedSeries({ key: "Antarctica", label: "Antarctica", values: [0, 1, 1] })).toBe(false);
  });

  it("does NOT match a rate-named column whose real values exceed the rate range", () => {
    expect(isRateShapedSeries({ key: "Growth Rate", label: "Growth Rate", values: [500, 1200] })).toBe(false);
  });

  it("treats an all-null series as vacuously in-range (name match still required)", () => {
    expect(isRateShapedSeries({ key: "Approval Rate", label: "Approval Rate", values: [null, null] })).toBe(true);
    expect(isRateShapedSeries({ key: "Count", label: "Count", values: [null, null] })).toBe(false);
  });
});

describe("toDistributionStats", () => {
  const distColumns = ["Country", "Company", "mean", "std", "min", "25th_percentile", "median_50th", "75th_percentile", "max", "skewness", "kurtosis"];

  it("detects the real FIG512/513 5-number-summary shape and extracts every stat", () => {
    const e = fixture(distColumns, [
      { Country: "China", Company: "Alibaba", mean: 2367.7, std: 4584.8, min: 42, "25th_percentile": 210.5, median_50th: 652, "75th_percentile": 2406, max: 26811, skewness: 3.38, kurtosis: 11.94 },
    ]);
    const result = toDistributionStats(e);
    expect(result?.rows).toEqual([
      { label: "China · Alibaba", mean: 2367.7, min: 42, q1: 210.5, median: 652, q3: 2406, max: 26811, skewness: 3.38, kurtosis: 11.94 },
    ]);
  });

  it("returns null for a shape missing even one of the 5 required quantile columns", () => {
    const e = fixture(["Country", "Company", "mean", "min", "max"], [{ Country: "US", Company: "X", mean: 1, min: 0, max: 2 }]);
    expect(toDistributionStats(e)).toBeNull();
  });

  it("ranks by median, not mean — the representative value for a real skewed distribution", () => {
    const e = fixture(distColumns, [
      { Country: "A", Company: "Low-median-high-mean", mean: 9000, std: 1, min: 0, "25th_percentile": 1, median_50th: 5, "75th_percentile": 10, max: 90000, skewness: 1, kurtosis: 1 },
      { Country: "B", Company: "High-median-low-mean", mean: 100, std: 1, min: 50, "25th_percentile": 80, median_50th: 100, "75th_percentile": 120, max: 150, skewness: 1, kurtosis: 1 },
    ]);
    const order = toDistributionStats(e)?.rows.map((r) => r.label);
    expect(order).toEqual(["B · High-median-low-mean", "A · Low-median-high-mean"]);
  });

  it('dedupes an adjacent identical label part, same as toRankedBars', () => {
    const e = fixture(distColumns, [
      { Country: "colt", Company: "colt", mean: 1, std: 1, min: 0, "25th_percentile": 0, median_50th: 1, "75th_percentile": 2, max: 3, skewness: 1, kurtosis: 1 },
    ]);
    expect(toDistributionStats(e)?.rows[0].label).toBe("colt");
  });

  it("skips a row missing a real quantile value rather than showing a half-real box", () => {
    const e = fixture(distColumns, [
      { Country: "A", Company: "Incomplete", mean: 1, std: 1, min: null, "25th_percentile": 0, median_50th: 1, "75th_percentile": 2, max: 3, skewness: 1, kurtosis: 1 },
    ]);
    expect(toDistributionStats(e)).toBeNull();
  });
});
