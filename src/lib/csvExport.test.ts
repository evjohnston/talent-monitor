import { describe, it, expect } from "vitest";
import { rowsToCsv } from "./csvExport.ts";

describe("rowsToCsv", () => {
  it("returns an empty string for zero rows rather than a header-only line", () => {
    expect(rowsToCsv([])).toBe("");
  });

  it("writes a real header row from the first row's own keys, in order", () => {
    const csv = rowsToCsv([{ Year: 2020, Value: 5 }]);
    expect(csv.split("\n")[0]).toBe("Year,Value");
  });

  it("renders null and undefined as an empty field, not the string \"null\"", () => {
    const csv = rowsToCsv([{ Year: 2020, Value: null }, { Year: 2021, Value: undefined }]);
    expect(csv).toBe("Year,Value\n2020,\n2021,");
  });

  it("quotes a field containing a comma", () => {
    const csv = rowsToCsv([{ Name: "Smith, Jane", Value: 1 }]);
    expect(csv).toContain('"Smith, Jane"');
  });

  it("quotes a field containing a newline", () => {
    const csv = rowsToCsv([{ Note: "line one\nline two" }]);
    expect(csv).toContain('"line one\nline two"');
  });

  it("doubles internal quotes and wraps the field in quotes", () => {
    const csv = rowsToCsv([{ Quip: 'She said "hi"' }]);
    expect(csv).toContain('"She said ""hi"""');
  });

  it("leaves a plain numeric/alpha field unquoted", () => {
    const csv = rowsToCsv([{ Country: "France", Count: 42 }]);
    expect(csv).toBe("Country,Count\nFrance,42");
  });

  it("preserves real row order (not sorted, not reversed)", () => {
    const csv = rowsToCsv([{ Year: 2022 }, { Year: 2020 }, { Year: 2021 }]);
    expect(csv.split("\n").slice(1)).toEqual(["2022", "2020", "2021"]);
  });
});
