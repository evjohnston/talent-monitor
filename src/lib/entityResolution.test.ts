import { describe, it, expect } from "vitest";
import { canonicalizeCompany } from "./entityResolution.ts";

describe("canonicalizeCompany", () => {
  it("groups FIG302's one real confirmed contemporaneous same-parent case", () => {
    // Confirmed by hand against talent_charts/data/FIG302.csv (2026-07-30)
    // — "HP Enterprise Svcs LLC" (a subsidiary) and "Hewlett Packard
    // Enterprise Company" (the parent) both recur across FIG302's real
    // 2009-2026 data as the same real company, not a merger over time.
    const a = canonicalizeCompany("HP ENTERPRISE SVCS LLC A HEWLETT P");
    const b = canonicalizeCompany("HEWLETT PACKARD ENTERPRISE COMPANY");
    expect(a.id).toBe(b.id);
    expect(a.name).toBe("Hewlett Packard Enterprise");
    expect(b.name).toBe("Hewlett Packard Enterprise");
  });

  it("does NOT group real historical mergers/acquisitions — each keeps its own identity", () => {
    // Confirmed with the user (2026-07-30): a company acquired by/merged
    // into another does not get its pre-merger years silently
    // re-attributed to the successor. Satyam Computer Services (acquired
    // by Tech Mahindra, 2013) and Larsen & Toubro Infotech + Mindtree
    // (merged into LTIMindtree, 2022) must resolve to DIFFERENT ids from
    // their real successor companies.
    const satyam = canonicalizeCompany("SATYAM COMPUTER SERVICES LIMITED");
    const techMahindra = canonicalizeCompany("TECH MAHINDRA AMERICAS INC");
    expect(satyam.id).not.toBe(techMahindra.id);

    const lti = canonicalizeCompany("LARSEN & TOUBRO INFOTECH LIMITED");
    const mindtree = canonicalizeCompany("MINDTREE LIMITED");
    const ltimindtree = canonicalizeCompany("LTIMINDTREE LIMITED");
    expect(lti.id).not.toBe(ltimindtree.id);
    expect(mindtree.id).not.toBe(ltimindtree.id);
    expect(lti.id).not.toBe(mindtree.id);
  });

  it("mechanically strips a real legal suffix without over-truncating the name", () => {
    expect(canonicalizeCompany("GOOGLE INC").name).toBe("GOOGLE");
    expect(canonicalizeCompany("INFOSYS LIMITED").name).toBe("INFOSYS");
    expect(canonicalizeCompany("COMPUNNEL SOFTWARE GROUP INC").name).toBe("COMPUNNEL SOFTWARE GROUP");
  });

  it("strips the real 'and Subsidiaries' suffix pattern seen in FIG302's own data", () => {
    expect(canonicalizeCompany("Accenture and Subsidiaries").name).toBe("Accenture");
    expect(canonicalizeCompany("Deloitte and Subsidiaries").name).toBe("Deloitte");
    // The real source data has this exact typo ("Subidiaries") — confirmed
    // in talent_charts/data/FIG302.csv, not a test-authoring mistake.
    expect(canonicalizeCompany("Hitachi Consulting and Subidiaries").name).toBe("Hitachi Consulting");
  });

  it("does not collide with an inherited Object.prototype property name", () => {
    // The old pre-rebuild app's own recovered entityResolution.ts hit this
    // exact real bug once (a company literally named "Constructor"); the
    // Object.hasOwn guard here is adapted from that fix, not speculative.
    const result = canonicalizeCompany("Constructor Inc");
    expect(result.name).toBe("Constructor");
  });

  it("falls back to the raw string when nothing is left after stripping", () => {
    expect(canonicalizeCompany("")).toEqual({ id: "", name: "" });
  });
});
