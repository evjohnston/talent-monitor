import { describe, it, expect } from "vitest";
import { canAddToCompare, isCompatibleForCompare, type MetricRegistryEntry } from "./metricRegistry.ts";

function entry(overrides: Partial<MetricRegistryEntry> = {}): MetricRegistryEntry {
  return {
    id: "TEST1",
    title: "Test",
    stage: "foundation",
    chapter: 1,
    topics: ["Other"],
    measureType: "timeseries",
    geography: "us-only",
    source: "Test",
    reportReference: "Ch. 1 — TEST1",
    searchText: "test",
    dateRange: "2000–2020",
    isDerived: false,
    ...overrides,
  };
}

describe("isCompatibleForCompare", () => {
  it("is compatible when measure types match", () => {
    expect(isCompatibleForCompare(entry(), entry({ id: "TEST2" }))).toBe(true);
  });

  it("is incompatible when measure types differ", () => {
    expect(isCompatibleForCompare(entry(), entry({ id: "TEST2", measureType: "ranked-snapshot" }))).toBe(false);
  });
});

describe("canAddToCompare", () => {
  it("allows adding to an empty set", () => {
    expect(canAddToCompare(entry(), [])).toBe(true);
  });

  it("allows a compatible addition", () => {
    const current = [entry({ id: "A" })];
    expect(canAddToCompare(entry({ id: "B" }), current)).toBe(true);
  });

  it("blocks an incompatible addition", () => {
    const current = [entry({ id: "A", measureType: "timeseries" })];
    expect(canAddToCompare(entry({ id: "B", measureType: "geographic" }), current)).toBe(false);
  });

  it("blocks re-adding an already-selected id", () => {
    const current = [entry({ id: "A" })];
    expect(canAddToCompare(entry({ id: "A" }), current)).toBe(false);
  });

  it("blocks a 5th real addition once 4 are already selected", () => {
    const current = ["A", "B", "C", "D"].map((id) => entry({ id }));
    expect(canAddToCompare(entry({ id: "E" }), current)).toBe(false);
  });
});
