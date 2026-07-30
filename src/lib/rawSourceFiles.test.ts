import { describe, it, expect } from "vitest";
import { resolveRawSourceFiles } from "./rawSourceFiles.ts";
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

describe("resolveRawSourceFiles", () => {
  it("resolves a direct exhibit to its own single raw file", () => {
    const e = fixture({ id: "FIG101" });
    expect(resolveRawSourceFiles(e, new Map())).toEqual(["FIG101.csv"]);
  });

  it("resolves a derived exhibit to its real source exhibit's raw file, not its own id", () => {
    const fig302 = fixture({ id: "FIG302" });
    const fig303 = fixture({ id: "FIG303", derivedFrom: ["FIG302"] });
    const byId = new Map([["FIG302", fig302], ["FIG303", fig303]]);
    expect(resolveRawSourceFiles(fig303, byId)).toEqual(["FIG302.csv"]);
  });

  it("resolves a derived exhibit with multiple real source files (TAB605's own real case)", () => {
    const tab605 = fixture({ id: "TAB605", derivedFrom: ["TAB605a", "TAB605b", "TAB605c"] });
    expect(resolveRawSourceFiles(tab605, new Map())).toEqual(["TAB605a.csv", "TAB605b.csv", "TAB605c.csv"]);
  });

  it("resolves a SPLIT-mode multi-part exhibit's hyphenated id to its real unhyphenated raw filename", () => {
    const e = fixture({ id: "TAB202-a" });
    expect(resolveRawSourceFiles(e, new Map())).toEqual(["TAB202a.csv"]);
  });

  it("resolves a MERGE-mode multi-part exhibit to every real part file that was folded into it", () => {
    const e = fixture({ id: "FIG301" });
    expect(resolveRawSourceFiles(e, new Map())).toEqual(["FIG301a.csv", "FIG301b.csv"]);
  });
});
