import { describe, it, expect } from "vitest";
import { buildDashboardContext, buildTrackContext, formatGenerated } from "./buildContext.ts";
import type { DataFile, Exhibit, StageNote } from "./types.ts";

function exhibit(overrides: Partial<Exhibit> = {}): Exhibit {
  return {
    id: "TEST1",
    stage: "foundation",
    chapter: 4,
    order: 0,
    title: "Test exhibit",
    kind: "timeseries",
    sourceShort: "Test source",
    sourceLong: "Test source, long form",
    sourceUrls: [],
    columns: ["Year", "Value"],
    rows: [{ Year: 2023, Value: 1 }],
    ...overrides,
  };
}

function note(overrides: Partial<StageNote> = {}): StageNote {
  return { stage: "foundation", date: "2026-01-01", author: "Test", headline: "Test headline", body: "Test body", ...overrides };
}

describe("buildTrackContext", () => {
  it("scopes exhibits to exactly one stage, in report order — not the full corpus", () => {
    const data: DataFile = {
      generatedAt: "2026-01-01T00:00:00Z",
      exhibits: [
        exhibit({ id: "F2", stage: "foundation", order: 2 }),
        exhibit({ id: "F1", stage: "foundation", order: 1 }),
        exhibit({ id: "D1", stage: "degree-production", order: 1 }),
      ],
      notes: [],
    };
    const ctx = buildTrackContext(data, "foundation");
    expect(ctx.exhibits.map((e) => e.id)).toEqual(["F1", "F2"]);
    expect(ctx.stage).toBe("foundation");
  });

  it("picks the latest real note for that stage only, ignoring other stages' notes", () => {
    const data: DataFile = {
      generatedAt: null as unknown as string,
      exhibits: [],
      notes: [
        note({ stage: "foundation", date: "2026-01-01", headline: "Old" }),
        note({ stage: "foundation", date: "2026-02-01", headline: "New" }),
        note({ stage: "degree-production", date: "2026-03-01", headline: "Other stage" }),
      ],
    };
    const ctx = buildTrackContext(data, "foundation");
    expect(ctx.note?.headline).toBe("New");
  });

  it("returns undefined note when the stage has none, rather than a wrong stage's note", () => {
    const data: DataFile = { generatedAt: null as unknown as string, exhibits: [], notes: [note({ stage: "degree-production" })] };
    const ctx = buildTrackContext(data, "foundation");
    expect(ctx.note).toBeUndefined();
  });

  it("finds a real annotation from a stage-scoped exhibit array, same as the full corpus would", () => {
    // FIG409-shaped fixture — buildAnnotations() only ever looks up
    // specific exhibits by id, so a stage-scoped array must still
    // produce the exact same real annotation this exhibit gets from the
    // full corpus.
    const covidExhibit = exhibit({
      id: "FIG409",
      stage: "foundation",
      columns: ["Year", "Value"],
      rows: [{ Year: 2020, Value: 10 }, { Year: 2021, Value: 5 }, { Year: 2022, Value: 8 }],
    });
    const data: DataFile = { generatedAt: null as unknown as string, exhibits: [covidExhibit], notes: [] };
    const ctx = buildTrackContext(data, "foundation");
    expect(ctx.annotations.some((a) => a.exhibitIds.includes("FIG409"))).toBe(true);
  });

  it("handles a null DataFile without throwing, same as buildDashboardContext", () => {
    const ctx = buildTrackContext(null, "foundation");
    expect(ctx.exhibits).toEqual([]);
    expect(ctx.note).toBeUndefined();
  });
});

describe("buildDashboardContext", () => {
  it("keeps the full, unscoped corpus across every stage — the real difference from buildTrackContext", () => {
    const data: DataFile = {
      generatedAt: "2026-01-01T00:00:00Z",
      exhibits: [exhibit({ id: "F1", stage: "foundation" }), exhibit({ id: "D1", stage: "degree-production" })],
      notes: [],
    };
    const ctx = buildDashboardContext(data);
    expect(ctx.exhibits.map((e) => e.id).sort()).toEqual(["D1", "F1"]);
    expect(ctx.exhibitsByStage.foundation.map((e) => e.id)).toEqual(["F1"]);
    expect(ctx.exhibitsByStage["degree-production"].map((e) => e.id)).toEqual(["D1"]);
  });

  it("carries only generatedAt, never a duplicate full copy of the exhibits array", () => {
    const data: DataFile = { generatedAt: "2026-01-01T00:00:00Z", exhibits: [exhibit()], notes: [] };
    const ctx = buildDashboardContext(data);
    expect(ctx.generatedAt).toBe("2026-01-01T00:00:00Z");
    expect(ctx).not.toHaveProperty("data");
  });
});

describe("formatGenerated", () => {
  it("formats a real ISO timestamp as a short, human-readable date", () => {
    const data: DataFile = { generatedAt: "2026-07-30T12:00:00Z", exhibits: [], notes: [] };
    expect(formatGenerated(data)).toMatch(/2026/);
  });

  it("returns an em dash for a null data file, never a fabricated date", () => {
    expect(formatGenerated(null)).toBe("—");
  });
});
