import { describe, it, expect } from "vitest";
import { readCompareCountriesFromUrl, MAX_COMPARE_COUNTRIES } from "./countryProfileUrlState.ts";

describe("readCompareCountriesFromUrl", () => {
  it("returns an empty list outside a browser (SSR-safe)", () => {
    expect(readCompareCountriesFromUrl()).toEqual([]);
  });
});

describe("MAX_COMPARE_COUNTRIES", () => {
  it("matches the issue's own locked 'up to three additional countries' rule", () => {
    expect(MAX_COMPARE_COUNTRIES).toBe(3);
  });
});
