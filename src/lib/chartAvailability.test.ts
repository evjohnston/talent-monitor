import { describe, it, expect } from "vitest";
import { hasChartSvg } from "./chartAvailability.ts";
import type { Exhibit } from "./types.ts";

function fixture(overrides: Partial<Exhibit>): Exhibit {
  return {
    id: "TEST",
    stage: "foundation",
    chapter: 1,
    order: 1,
    title: "Test",
    kind: "timeseries",
    sourceShort: "Test",
    sourceLong: "Test",
    sourceUrls: [],
    columns: [],
    rows: [],
    ...overrides,
  };
}

describe("hasChartSvg", () => {
  it("is true for timeseries, share-timeseries, and country-map", () => {
    expect(hasChartSvg(fixture({ kind: "timeseries" }))).toBe(true);
    expect(hasChartSvg(fixture({ kind: "share-timeseries" }))).toBe(true);
    expect(hasChartSvg(fixture({ kind: "country-map" }))).toBe(true);
  });

  it("is false for ranked-bar and leaderboard-years — both real, confirmed plain-HTML/CSS renderers", () => {
    expect(hasChartSvg(fixture({ kind: "ranked-bar" }))).toBe(false);
    expect(hasChartSvg(fixture({ kind: "leaderboard-years" }))).toBe(false);
  });

  it("is false for FIG601/FIG602 regardless of kind — they never render as their own standalone panel (TrackRetentionImmigration's own excludeIds)", () => {
    expect(hasChartSvg(fixture({ id: "FIG601", kind: "share-timeseries" }))).toBe(false);
    expect(hasChartSvg(fixture({ id: "FIG602", kind: "share-timeseries" }))).toBe(false);
  });
});
