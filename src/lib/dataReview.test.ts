import { describe, it, expect } from "vitest";
import { buildReviewRecords, validateReviewRecords, type ReviewStatusFile } from "./dataReview.ts";
import type { CrosswalkRow } from "./loadCrosswalk.ts";
import type { Exhibit } from "./types.ts";

function timeseriesExhibit(overrides: Partial<Exhibit> = {}): Exhibit {
  return {
    id: "TEST1",
    stage: "foundation",
    chapter: 1,
    order: 0,
    title: "Test exhibit",
    kind: "timeseries",
    sourceShort: "Test Source",
    sourceLong: "Test Source, long form",
    sourceUrls: ["https://example.org"],
    columns: ["Year", "Value"],
    rows: [2018, 2019, 2020].map((y, i) => ({ Year: y, Value: 100 + i * 10 })),
    ...overrides,
  };
}

function multiDimExhibit(): Exhibit {
  return {
    id: "TEST-MULTI",
    stage: "foundation",
    chapter: 1,
    order: 0,
    title: "Test multi-dimension exhibit",
    kind: "timeseries",
    sourceShort: "Test Source",
    sourceLong: "Test Source, long form",
    sourceUrls: [],
    columns: ["Year", "Country", "Value"],
    rows: [
      { Year: 2020, Country: "China", Value: 1 },
      { Year: 2020, Country: "United States", Value: 2 },
      { Year: 2021, Country: "China", Value: 3 },
      { Year: 2021, Country: "United States", Value: 4 },
    ],
  };
}

const emptyCrosswalk = new Map<string, CrosswalkRow>();
const emptyStatus: ReviewStatusFile = {};

describe("buildReviewRecords", () => {
  it("computes real first/last/min/max values and change from a plain timeseries", () => {
    const [record] = buildReviewRecords([timeseriesExhibit()], emptyCrosswalk, emptyStatus);
    expect(record.first_period).toBe("2018");
    expect(record.last_period).toBe("2020");
    expect(record.first_value).toBe("100");
    expect(record.last_value).toBe("120");
    expect(record.absolute_change).toBe("20.00");
    expect(record.relative_change).toBe("20.0%");
    expect(record.minimum_value).toBe("100");
    expect(record.maximum_value).toBe("120");
  });

  it("does not flag a real multi-dimension exhibit (Year + Country) as having duplicate keys", () => {
    const [record] = buildReviewRecords([multiDimExhibit()], emptyCrosswalk, emptyStatus);
    expect(record.duplicate_key_count).toBe(0);
  });

  it("leaves population/unit blank rather than fabricating a value", () => {
    const [record] = buildReviewRecords([timeseriesExhibit()], emptyCrosswalk, emptyStatus);
    expect(record.population).toBe("");
    expect(record.unit).toBe("");
  });

  it("counts a real per-row estimate/confirmed flag column", () => {
    const exhibit = timeseriesExhibit({
      columns: ["Year", "Value", "Flag"],
      rows: [
        { Year: 2018, Value: 100, Flag: "estimate" },
        { Year: 2019, Value: 110, Flag: "confirmed" },
        { Year: 2020, Value: 120, Flag: "confirmed" },
      ],
    });
    const [record] = buildReviewRecords([exhibit], emptyCrosswalk, emptyStatus);
    expect(record.estimated_value_count).toBe(1);
  });

  it("counts real projected-column values", () => {
    const exhibit = timeseriesExhibit({
      columns: ["Year", "China", "China (projected)"],
      rows: [
        { Year: 2019, China: 10, "China (projected)": null },
        { Year: 2020, China: 11, "China (projected)": null },
        { Year: 2021, China: null, "China (projected)": 12 },
      ],
    });
    const [record] = buildReviewRecords([exhibit], emptyCrosswalk, emptyStatus);
    expect(record.projected_value_count).toBe(1);
  });

  it("carries a derived exhibit's own calculationNote/dataNote through", () => {
    const exhibit = timeseriesExhibit({ derivedFrom: ["OTHER"], calculationNote: "computed from OTHER", dataNote: "a real caveat" });
    const [record] = buildReviewRecords([exhibit], emptyCrosswalk, emptyStatus);
    expect(record.calculation_note).toBe("computed from OTHER");
    expect(record.caveat).toBe("a real caveat");
  });

  it("preserves an existing author-set review status rather than resetting it", () => {
    const status: ReviewStatusFile = { TEST1: { review_status: "verified", review_comment: "checked by hand" } };
    const [record] = buildReviewRecords([timeseriesExhibit()], emptyCrosswalk, status);
    expect(record.review_status).toBe("verified");
    expect(record.review_comment).toBe("checked by hand");
  });

  it("defaults to not_reviewed with no status file entry", () => {
    const [record] = buildReviewRecords([timeseriesExhibit()], emptyCrosswalk, emptyStatus);
    expect(record.review_status).toBe("not_reviewed");
  });

  it("leaves a ranked-bar/no-Year exhibit's period fields blank rather than fabricating one", () => {
    const exhibit = timeseriesExhibit({ kind: "ranked-bar", columns: ["Country", "Value"], rows: [{ Country: "US", Value: 5 }, { Country: "CN", Value: 3 }] });
    const [record] = buildReviewRecords([exhibit], emptyCrosswalk, emptyStatus);
    expect(record.first_period).toBe("");
    expect(record.last_period).toBe("");
    expect(record.minimum_value).toBe("3");
    expect(record.maximum_value).toBe("5");
  });
});

describe("validateReviewRecords", () => {
  it("flags a missing source", () => {
    const exhibit = timeseriesExhibit({ sourceShort: "" });
    const records = buildReviewRecords([exhibit], emptyCrosswalk, emptyStatus);
    const errors = validateReviewRecords(records, [exhibit]);
    expect(errors.some((e) => e.message === "missing source")).toBe(true);
  });

  it("flags a real duplicate primary key", () => {
    const exhibit = timeseriesExhibit({ rows: [{ Year: 2020, Value: 1 }, { Year: 2020, Value: 2 }] });
    const records = buildReviewRecords([exhibit], emptyCrosswalk, emptyStatus);
    const errors = validateReviewRecords(records, [exhibit]);
    expect(errors.some((e) => e.message.includes("duplicate primary key"))).toBe(true);
  });

  it("flags a derived exhibit missing its own calculation note", () => {
    const exhibit = timeseriesExhibit({ derivedFrom: ["OTHER"] });
    const records = buildReviewRecords([exhibit], emptyCrosswalk, emptyStatus);
    const errors = validateReviewRecords(records, [exhibit]);
    expect(errors.some((e) => e.message.includes("calculation note"))).toBe(true);
  });

  it("passes a real, complete exhibit with zero errors", () => {
    const exhibit = timeseriesExhibit();
    const records = buildReviewRecords([exhibit], emptyCrosswalk, emptyStatus);
    expect(validateReviewRecords(records, [exhibit])).toEqual([]);
  });
});
