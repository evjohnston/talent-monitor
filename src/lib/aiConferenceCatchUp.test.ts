import { describe, it, expect } from "vitest";
import { computeAiConferenceCatchUp } from "./aiConferenceCatchUp.ts";
import type { Exhibit } from "./types.ts";

function fixture(rows: Record<string, string | number | null>[]): Exhibit {
  return {
    id: "TAB501",
    stage: "research-output",
    chapter: 5,
    order: 1001,
    title: "When Did China Catch Up at Each AI Conference?",
    kind: "ranked-bar",
    sourceShort: "Test source",
    sourceLong: "Test source, long form",
    sourceUrls: [],
    columns: ["conf_norm", "conference", "year", "country", "count", "share"],
    rows,
  };
}

describe("computeAiConferenceCatchUp", () => {
  it("finds the first real year China's share reaches or exceeds the US's", () => {
    // A simplified version of the real CVPR shape — China overtakes in
    // 2023, and stays ahead through 2025.
    const e = fixture([
      { conf_norm: "cvpr", conference: "cvpr", year: 2021, country: "China", count: 1, share: 0.3 },
      { conf_norm: "cvpr", conference: "cvpr", year: 2021, country: "United States", count: 1, share: 0.35 },
      { conf_norm: "cvpr", conference: "cvpr", year: 2023, country: "China", count: 1, share: 0.40 },
      { conf_norm: "cvpr", conference: "cvpr", year: 2023, country: "United States", count: 1, share: 0.22 },
    ]);
    const [result] = computeAiConferenceCatchUp(e);
    expect(result.conference).toBe("CVPR");
    expect(result.catchUpYear).toBe(2023);
    expect(result.latestYear).toBe(2023);
    expect(result.latestChinaShare).toBeCloseTo(0.40);
  });

  it('reports "not yet" (null) when China never reaches the US\'s share in the real data', () => {
    // The real COLT shape — China stays under 10% for over a decade
    // while the US stays over 50%. The exact case that broke the old
    // generic ranked-bar fallback into a "colt, colt, colt..." jumble.
    const e = fixture([
      { conf_norm: "colt", conference: "colt", year: 2011, country: "China", count: 2, share: 0.019 },
      { conf_norm: "colt", conference: "colt", year: 2011, country: "United States", count: 43, share: 0.413 },
      { conf_norm: "colt", conference: "colt", year: 2024, country: "China", count: 19, share: 0.033 },
      { conf_norm: "colt", conference: "colt", year: 2024, country: "United States", count: 353, share: 0.612 },
    ]);
    const [result] = computeAiConferenceCatchUp(e);
    expect(result.catchUpYear).toBeNull();
    expect(result.latestYear).toBe(2024);
  });

  it("skips a real conference whose most recent year is missing one country entirely", () => {
    // A real, incomplete final year (e.g. one country hasn't reported
    // yet) shouldn't produce a half-real "latest" comparison.
    const e = fixture([
      { conf_norm: "iros", conference: "iros", year: 2020, country: "China", count: 1, share: 0.3 },
      { conf_norm: "iros", conference: "iros", year: 2020, country: "United States", count: 1, share: 0.3 },
      { conf_norm: "iros", conference: "iros", year: 2021, country: "China", count: 1, share: 0.35 },
      // no United States row for 2021 — a real gap
    ]);
    expect(computeAiConferenceCatchUp(e)).toEqual([]);
  });

  it("ignores a real non-China/US country row rather than crashing on it", () => {
    const e = fixture([
      { conf_norm: "wacv", conference: "wacv", year: 2020, country: "China", count: 1, share: 0.2 },
      { conf_norm: "wacv", conference: "wacv", year: 2020, country: "United States", count: 1, share: 0.3 },
      { conf_norm: "wacv", conference: "wacv", year: 2020, country: "Germany", count: 1, share: 0.1 },
    ]);
    const [result] = computeAiConferenceCatchUp(e);
    expect(result.conference).toBe("WACV");
  });

  it("sorts real catch-ups earliest-first, with \"not yet\" conferences last", () => {
    const e = fixture([
      { conf_norm: "late", conference: "late", year: 2024, country: "China", count: 1, share: 0.4 },
      { conf_norm: "late", conference: "late", year: 2024, country: "United States", count: 1, share: 0.3 },
      { conf_norm: "early", conference: "early", year: 2015, country: "China", count: 1, share: 0.4 },
      { conf_norm: "early", conference: "early", year: 2015, country: "United States", count: 1, share: 0.3 },
      { conf_norm: "never", conference: "never", year: 2024, country: "China", count: 1, share: 0.1 },
      { conf_norm: "never", conference: "never", year: 2024, country: "United States", count: 1, share: 0.5 },
    ]);
    const order = computeAiConferenceCatchUp(e).map((r) => r.conference);
    expect(order).toEqual(["EARLY", "LATE", "NEVER"]);
  });
});
