import { describe, it, expect } from "vitest";
import { buildMetricRegistry, searchRegistry } from "./metricRegistry.ts";
import type { Exhibit } from "./types.ts";

function fixture(overrides: Partial<Exhibit> = {}): Exhibit {
  return {
    id: "TEST1",
    stage: "workforce-entry",
    chapter: 3,
    order: 0,
    title: "Which Employers Receive the Most H-1B Approvals?",
    kind: "leaderboard-years",
    sourceShort: "USCIS, H-1B Employer Data Hub",
    sourceLong: "USCIS, H-1B Employer Data Hub, long form",
    sourceUrls: [],
    columns: ["Company", "2020", "2021"],
    rows: [{ Company: "Acme", "2020": 10, "2021": 20 }],
    ...overrides,
  };
}

describe("buildMetricRegistry", () => {
  it("derives a real topic from the exhibit's own title", () => {
    const [entry] = buildMetricRegistry([fixture()]);
    expect(entry.topics).toContain("H-1B");
  });

  it("never leaves an exhibit with zero topics", () => {
    const exotic = fixture({ title: "A Completely Unrelated Question About Nothing In Particular" });
    const [entry] = buildMetricRegistry([exotic]);
    expect(entry.topics.length).toBeGreaterThan(0);
  });

  it("derives leaderboard-years as the leaderboard measure type", () => {
    const [entry] = buildMetricRegistry([fixture()]);
    expect(entry.measureType).toBe("leaderboard");
  });

  it("derives country-map exhibits as world geography", () => {
    const exhibit = fixture({ kind: "country-map", columns: ["Country", "Value"], rows: [{ Country: "US", Value: 1 }] });
    const [entry] = buildMetricRegistry([exhibit]);
    expect(entry.geography).toBe("world");
  });

  it("computes a real date range from a Year column", () => {
    const exhibit = fixture({
      kind: "timeseries",
      columns: ["Year", "Value"],
      rows: [{ Year: 2018, Value: 1 }, { Year: 2024, Value: 2 }],
    });
    const [entry] = buildMetricRegistry([exhibit]);
    expect(entry.dateRange).toBe("2018–2024");
  });

  it("leaves dateRange null for a shape with no Year column", () => {
    const [entry] = buildMetricRegistry([fixture()]); // leaderboard-years fixture above has no "Year" column
    expect(entry.dateRange).toBeNull();
  });

  it("flags a derived exhibit via isDerived", () => {
    const exhibit = fixture({ derivedFrom: ["OTHER"] });
    const [entry] = buildMetricRegistry([exhibit]);
    expect(entry.isDerived).toBe(true);
  });
});

describe("searchRegistry", () => {
  it("matches on title text case-insensitively", () => {
    const registry = buildMetricRegistry([fixture()]);
    expect(searchRegistry(registry, "h-1b")).toHaveLength(1);
    expect(searchRegistry(registry, "H-1B")).toHaveLength(1);
  });

  it("matches on exhibit id", () => {
    const registry = buildMetricRegistry([fixture()]);
    expect(searchRegistry(registry, "TEST1")).toHaveLength(1);
  });

  it("returns every entry for an empty query", () => {
    const registry = buildMetricRegistry([fixture(), fixture({ id: "TEST2", title: "Something else entirely" })]);
    expect(searchRegistry(registry, "")).toHaveLength(2);
  });

  it("returns no results for a query matching nothing real", () => {
    const registry = buildMetricRegistry([fixture()]);
    expect(searchRegistry(registry, "zzz-not-a-real-match")).toHaveLength(0);
  });
});
