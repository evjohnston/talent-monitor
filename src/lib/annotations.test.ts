import { describe, it, expect } from "vitest";
import { buildAnnotations, validateAnnotations, annotationsForExhibit, type ChartAnnotation } from "./annotations.ts";
import type { Exhibit } from "./types.ts";

function fig409(): Exhibit {
  return {
    id: "FIG409",
    stage: "foundation",
    chapter: 4,
    order: 9,
    title: "How Many Americans Study Abroad",
    kind: "timeseries",
    sourceShort: "Test",
    sourceLong: "Test",
    sourceUrls: [],
    columns: ["Year", "U.S. Study Abroad", "Total US Enrollment"],
    rows: [1990, 2000, 2010, 2020, 2021, 2022, 2024].map((y) => ({ Year: y, "U.S. Study Abroad": 100, "Total US Enrollment": 10000 })),
  };
}

function fig109(): Exhibit {
  const rows: Record<string, number | null>[] = [];
  for (let y = 2015; y <= 2020; y++) rows.push({ Year: y, China: 1000 + y, "China (projected)": null });
  for (let y = 2021; y <= 2025; y++) rows.push({ Year: y, China: null, "China (projected)": 2000 + y });
  return {
    id: "FIG109",
    stage: "degree-production",
    chapter: 2,
    order: 9,
    title: "Test projection exhibit",
    kind: "timeseries",
    sourceShort: "Test",
    sourceLong: "Test",
    sourceUrls: [],
    columns: ["Year", "China", "China (projected)"],
    rows,
  };
}

function tab501(): Exhibit {
  return {
    id: "TAB501",
    stage: "research-output",
    chapter: 5,
    order: 1,
    title: "Test AI conference exhibit",
    kind: "ranked-bar",
    sourceShort: "Test",
    sourceLong: "Test",
    sourceUrls: [],
    columns: ["conf_norm", "conference", "year", "country", "count", "share"],
    rows: [
      { conf_norm: "cvpr", conference: "CVPR", year: 2018, country: "China", count: 1, share: 0.2 },
      { conf_norm: "cvpr", conference: "CVPR", year: 2018, country: "United States", count: 1, share: 0.3 },
      { conf_norm: "cvpr", conference: "CVPR", year: 2019, country: "China", count: 1, share: 0.35 },
      { conf_norm: "cvpr", conference: "CVPR", year: 2019, country: "United States", count: 1, share: 0.3 },
      { conf_norm: "cvpr", conference: "CVPR", year: 2020, country: "China", count: 1, share: 0.4 },
      { conf_norm: "cvpr", conference: "CVPR", year: 2020, country: "United States", count: 1, share: 0.25 },
    ],
  };
}

function fig606(): Exhibit {
  return {
    id: "FIG606",
    stage: "retention-immigration",
    chapter: 5,
    order: 6,
    title: "Test PERM exhibit",
    kind: "timeseries",
    sourceShort: "Test",
    sourceLong: "Test",
    sourceUrls: [],
    columns: ["Year", "Certified (Current + Expired)", "Certified-expired"],
    rows: [
      { Year: 2024, "Certified (Current + Expired)": 100, "Certified-expired": 20 },
      { Year: 2025, "Certified (Current + Expired)": 200, "Certified-expired": 82 },
    ],
  };
}

describe("buildAnnotations", () => {
  it("builds a real event annotation from FIG409's own report-sourced COVID marker", () => {
    const result = buildAnnotations([fig409()]);
    const covid = result.find((a) => a.id === "fig409-covid");
    expect(covid).toBeDefined();
    expect(covid?.start).toBe(2021);
    expect(covid?.type).toBe("event");
  });

  it("computes a real projection-start boundary from the last observed / first projected year", () => {
    const result = buildAnnotations([fig109()]);
    const boundary = result.find((a) => a.id === "fig109-projection-start");
    expect(boundary).toBeDefined();
    expect(boundary?.start).toBe(2021);
    expect(boundary?.type).toBe("projection_start");
  });

  it("reuses computeAiConferenceCatchUp's own real result for the TAB501 crossing annotation", () => {
    const result = buildAnnotations([tab501()]);
    const crossing = result.find((a) => a.id === "tab501-cvpr-crossing");
    expect(crossing).toBeDefined();
    expect(crossing?.start).toBe(2019); // China's share (0.35) first >= US's (0.3) in 2019
  });

  it("computes the real PERM expiration share from FIG606's own columns", () => {
    const result = buildAnnotations([fig606()]);
    const perm = result.find((a) => a.id === "fig606-perm-expiration");
    expect(perm).toBeDefined();
    expect(perm?.start).toBe(2025);
    expect(perm?.label).toContain("41%"); // 82/200
  });

  it("skips an annotation whose source exhibit isn't present, rather than throwing", () => {
    expect(() => buildAnnotations([])).not.toThrow();
    expect(buildAnnotations([])).toEqual([]);
  });
});

describe("annotationsForExhibit", () => {
  it("returns only annotations referencing the given exhibit id", () => {
    const all = buildAnnotations([fig409(), fig109()]);
    expect(annotationsForExhibit(all, "FIG409")).toHaveLength(1);
    expect(annotationsForExhibit(all, "FIG999")).toHaveLength(0);
  });
});

describe("validateAnnotations", () => {
  const exhibits = [fig409()];

  it("flags an annotation referencing an unknown exhibit id", () => {
    const bad: ChartAnnotation = {
      id: "bad-1", exhibitIds: ["FIG999"], stage: "foundation", type: "custom",
      start: 2020, label: "x", detail: "x", priority: 1, showByDefault: true,
    };
    const errors = validateAnnotations([bad], exhibits);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("unknown exhibit id");
  });

  it("flags a start year outside the exhibit's real year range", () => {
    const bad: ChartAnnotation = {
      id: "bad-2", exhibitIds: ["FIG409"], stage: "foundation", type: "custom",
      start: 1899, label: "x", detail: "x", priority: 1, showByDefault: true,
    };
    const errors = validateAnnotations([bad], exhibits);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("outside");
  });

  it("passes a real, in-range annotation with no errors", () => {
    const good: ChartAnnotation = {
      id: "good-1", exhibitIds: ["FIG409"], stage: "foundation", type: "event",
      start: 2021, label: "x", detail: "x", priority: 1, showByDefault: true,
    };
    expect(validateAnnotations([good], exhibits)).toEqual([]);
  });

  it("the real, shipped registry has zero validation errors against the real exhibit corpus", () => {
    const all = buildAnnotations([fig409(), fig109(), tab501(), fig606()]);
    expect(validateAnnotations(all, [fig409(), fig109(), tab501(), fig606()])).toEqual([]);
  });
});
