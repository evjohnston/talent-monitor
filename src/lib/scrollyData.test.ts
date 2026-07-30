import { describe, it, expect } from "vitest";
import {
  degreeLevelInternationalShare,
  fieldInternationalShareBookend,
  domesticPipelineFunnel,
  immigrationGates,
  researchLeadershipMetrics,
} from "./scrollyData.ts";
import type { Exhibit } from "./types.ts";

function fixture(id: string, columns: string[], rows: Record<string, string | number | null>[]): Exhibit {
  return {
    id, stage: "foundation", chapter: 1, order: 1, title: "Test", kind: "timeseries",
    sourceShort: "Test", sourceLong: "Test", sourceUrls: [], columns, rows,
  };
}

describe("degreeLevelInternationalShare", () => {
  it("converts FIG108's real 0-1 fractions to real percentages", () => {
    const exhibits = [fixture("FIG108", ["Year", "Bachelors", "Masters", "Research Doctorates (SED)"], [
      { Year: 2024, Bachelors: 0.0617, Masters: 0.5095, "Research Doctorates (SED)": 0.3644 },
    ])];
    const [result] = degreeLevelInternationalShare(exhibits);
    expect(result.year).toBe(2024);
    expect(result.bachelors).toBeCloseTo(6.17, 5);
    expect(result.masters).toBeCloseTo(50.95, 5);
    expect(result.doctorate).toBeCloseTo(36.44, 5);
  });

  it("returns an empty array when FIG108 isn't present rather than throwing", () => {
    expect(degreeLevelInternationalShare([])).toEqual([]);
  });
});

describe("fieldInternationalShareBookend", () => {
  it("reads TAB101's own real LastYear columns per field", () => {
    const exhibits = [fixture("TAB101", ["Field", "Bachelors_LastYear", "Masters_LastYear", "Doctorate_LastYear"], [
      { Field: "Engineering", Bachelors_LastYear: 5.4, Masters_LastYear: 52.5, Doctorate_LastYear: 48.9 },
    ])];
    expect(fieldInternationalShareBookend(exhibits)).toEqual([{ field: "Engineering", bachelors: 5.4, masters: 52.5, doctorate: 48.9 }]);
  });
});

describe("domesticPipelineFunnel", () => {
  it("uses TAB401's most recent real cohort and sums to roughly 100%", () => {
    const exhibits = [fixture("TAB401", ["cohort", "stem_bachelors", "nonstem_bachelors", "subbac_credential", "still_enrolled", "left_no_degree"], [
      { cohort: "2003/04", stem_bachelors: 41.1, nonstem_bachelors: 23.3, subbac_credential: 3, still_enrolled: 12.3, left_no_degree: 20.3 },
      { cohort: "2011/12", stem_bachelors: 41.9, nonstem_bachelors: 25.8, subbac_credential: 4.1, still_enrolled: 11.2, left_no_degree: 16.9 },
    ])];
    const result = domesticPipelineFunnel(exhibits);
    expect(result?.cohort).toBe("2011/12");
    const total = result!.stages.reduce((s, st) => s + st.pct, 0);
    expect(total).toBeCloseTo(99.9, 1);
  });

  it("distinguishes leaving STEM (still in college) from leaving college entirely", () => {
    const exhibits = [fixture("TAB401", ["cohort", "stem_bachelors", "nonstem_bachelors", "subbac_credential", "still_enrolled", "left_no_degree"], [
      { cohort: "2011/12", stem_bachelors: 41.9, nonstem_bachelors: 25.8, subbac_credential: 4.1, still_enrolled: 11.2, left_no_degree: 16.9 },
    ])];
    const result = domesticPipelineFunnel(exhibits)!;
    const leftStem = result.stages.find((s) => s.label.includes("non-STEM"));
    const leftCollege = result.stages.find((s) => s.label.includes("Left college"));
    expect(leftStem?.group).toBe("left-stem");
    expect(leftCollege?.group).toBe("left-college");
  });

  it("returns null rather than a fabricated funnel when TAB401 isn't present", () => {
    expect(domesticPipelineFunnel([])).toBeNull();
  });
});

describe("immigrationGates", () => {
  it("builds one real fact per gate from the real, most recent row of each exhibit", () => {
    const exhibits = [
      fixture("FIG603", ["Year", "Received", "Approved", "Denied", "Approval Rate"], [{ Year: 2025, Received: 22285, Approved: 18745, Denied: 797, "Approval Rate": 0.959 }]),
      fixture("FIG303", ["Year", "Top 10 employers' share of approvals"], [{ Year: 2026, "Top 10 employers' share of approvals": 53.8 }]),
      fixture("FIG606", ["Year", "Certified (Current + Expired)", "Certified-expired"], [{ Year: 2025, "Certified (Current + Expired)": 137753, "Certified-expired": 57073 }]),
      fixture("TAB605", ["Year", "India: EB2"], [{ Year: 2025, "India: EB2": 149 }]),
    ];
    const gates = immigrationGates(exhibits);
    expect(gates).toHaveLength(4);
    expect(gates.map((g) => g.label)).toEqual(["OPT / STEM OPT", "H-1B", "PERM", "Green card"]);
    expect(gates[3].fact).toContain("149 years");
  });

  it("skips a gate cleanly when its source exhibit is missing, rather than showing a fabricated fact", () => {
    expect(immigrationGates([])).toEqual([]);
  });
});

describe("researchLeadershipMetrics", () => {
  it("aggregates TAB506's own company-level patents to real country totals", () => {
    const exhibits = [fixture("TAB506", ["Company", "Country", "2025 Patents"], [
      { Company: "A", Country: "United States", "2025 Patents": 100 },
      { Company: "B", Country: "United States", "2025 Patents": 50 },
      { Company: "C", Country: "China", "2025 Patents": 30 },
    ])];
    const metrics = researchLeadershipMetrics(exhibits);
    const patents = metrics.find((m) => m.key === "patents")!;
    expect(patents.us).toBe(150);
    expect(patents.china).toBe(30);
    expect(patents.unit).toBe("count");
  });

  it("converts share-based metrics to real percentages", () => {
    const exhibits = [fixture("FIG501", ["Year", "United States", "China", "Rest of the World"], [{ Year: 2025, "United States": 0.34, China: 0.336, "Rest of the World": 0.323 }])];
    const metrics = researchLeadershipMetrics(exhibits);
    expect(metrics[0].us).toBeCloseTo(34, 5);
    expect(metrics[0].unit).toBe("share");
  });
});
