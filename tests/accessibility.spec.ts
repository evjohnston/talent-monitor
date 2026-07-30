import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// A committed version of the scratchpad axe-core sweep that found and
// fixed 6 real violation categories on 2026-07-29 (see CLAUDE.md's
// "Accessibility" section) — every one of those was a genuine, systemic
// pattern hit on every page, not a one-off, so this runs the same real
// check on every real route going forward instead of relying on someone
// remembering to re-run a scratchpad script by hand.
// Relative, no leading slash — joined against playwright.config.ts's own
// baseURL (which may itself be a subpath, e.g. CI's /<repo-name>/). A
// leading "/" here would resolve from the bare origin instead and 404 in
// CI, where astro preview serves dist/ under that subpath, not root.
const ROUTES = [
  "",
  "foundation/",
  "degree-production/",
  "graduate-training/",
  "workforce-entry/",
  "retention-immigration/",
  "research-output/",
  "methodology/",
  "downloads/",
  "explorer/",
];

for (const route of ROUTES) {
  const label = route === "" ? "/ (overview)" : `/${route}`;
  test(`${label} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} nodes): ${v.description}`);
    expect(summary, summary.join("\n")).toEqual([]);
  });
}
