import { describe, it, expect } from "vitest";
import { buildDataSourceCatalog } from "./dataSourceCatalog.ts";
import type { Exhibit } from "./types.ts";

function fixture(overrides: Partial<Exhibit>): Exhibit {
  return {
    id: "TEST",
    stage: "foundation",
    chapter: 1,
    order: 1,
    title: "Test",
    kind: "timeseries",
    sourceShort: "Test Org, Test Dataset, 2020.",
    sourceLong: "Test Org, Test Dataset, 2020.",
    sourceUrls: [],
    columns: [],
    rows: [],
    ...overrides,
  };
}

describe("buildDataSourceCatalog", () => {
  it("groups exhibits by the citing organization, deduplicating shared datasets", () => {
    const exhibits = [
      fixture({ id: "A", sourceShort: "NCES, IPEDS Completions, 1995–2024.", sourceUrls: ["https://nces.example"] }),
      fixture({ id: "B", sourceShort: "NCES, IPEDS Completions, 1995–2024.", sourceUrls: ["https://nces.example"] }),
      fixture({ id: "C", sourceShort: "OECD, PISA 2022 Results.", sourceUrls: [] }),
    ];
    const catalog = buildDataSourceCatalog(exhibits);
    expect(catalog.map((c) => c.organization)).toEqual(["NCES", "OECD"]);
    const nces = catalog.find((c) => c.organization === "NCES")!;
    expect(nces.datasets).toEqual(["NCES, IPEDS Completions, 1995–2024"]);
    expect(nces.exhibitIds).toEqual(["A", "B"]);
    expect(nces.urls).toEqual(["https://nces.example"]);
  });

  it("normalizes a real trailing-period inconsistency in the source data (confirmed: USCIS's own H-1B citation appears both with and without one)", () => {
    const exhibits = [
      fixture({ id: "A", sourceShort: "USCIS, H-1B Employer Data Hub, 2009–2026" }),
      fixture({ id: "B", sourceShort: "USCIS, H-1B Employer Data Hub, 2009–2026." }),
    ];
    const catalog = buildDataSourceCatalog(exhibits);
    expect(catalog).toHaveLength(1);
    expect(catalog[0].datasets).toHaveLength(1);
  });

  it("splits on the first TOP-LEVEL comma, not one nested inside parentheses (a real multi-source citation: IPO Association's own year list)", () => {
    const exhibits = [
      fixture({ sourceShort: 'IPO Association (2005, 2015), Harrity & Harrity "Patent 300" (2025), and USPTO PatentsView.' }),
    ];
    const catalog = buildDataSourceCatalog(exhibits);
    expect(catalog[0].organization).toBe("IPO Association (2005, 2015)");
  });

  it("sorts organizations alphabetically", () => {
    const exhibits = [fixture({ sourceShort: "Zeta, Data." }), fixture({ sourceShort: "Alpha, Data." })];
    const catalog = buildDataSourceCatalog(exhibits);
    expect(catalog.map((c) => c.organization)).toEqual(["Alpha", "Zeta"]);
  });
});
