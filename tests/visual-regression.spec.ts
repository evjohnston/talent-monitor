import { test, expect } from "@playwright/test";

// A small, deliberately scoped set of pixel-diff snapshots — NOT one per
// exhibit (91 real exhibits would make this suite slow and, per the
// tracked issue's own concern, a much larger flakiness surface). One
// representative panel per real ChartKind this app renders, plus the two
// elements a reader sees first, covers whether a shared rendering path
// (SeriesChart, WorldMap, LeaderboardYears, BarRow, Sankey) broke, without
// needing 91 near-duplicate baselines.
//
// Baselines are only meaningful if generated on the same OS/font stack
// they're compared against — Playwright screenshots differ by a few
// pixels of anti-aliasing across macOS vs. Linux even with an identical
// Chromium build. This repo's real CI runs on ubuntu-latest
// (build-and-deploy.yml), so baselines are generated there too (the
// `visual-baseline` workflow, run once by hand via `gh workflow run`),
// never captured from a contributor's own machine — see CLAUDE.md's
// "Visual regression" section for the exact one-time process.
test.use({ viewport: { width: 1280, height: 900 }, contextOptions: { reducedMotion: "reduce" } });

const SNAPSHOT_OPTS = { maxDiffPixelRatio: 0.02 };

test("Overview hero headline and KPI row", async ({ page }) => {
  await page.goto("", { waitUntil: "networkidle" });
  await expect(page.locator(".finding-headline")).toHaveScreenshot("overview-hero.png", SNAPSHOT_OPTS);
  await expect(page.locator(".kpirow")).toHaveScreenshot("overview-kpirow.png", SNAPSHOT_OPTS);
});

test("Foundation: timeseries hero and country-map panel", async ({ page }) => {
  await page.goto("foundation/", { waitUntil: "networkidle" });
  await expect(page.locator('[data-exhibit-id="FIG401"]')).toHaveScreenshot("foundation-fig401-timeseries.png", SNAPSHOT_OPTS);
  await page.locator('[data-exhibit-id="FIG402"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-exhibit-id="FIG402"]')).toHaveScreenshot("foundation-fig402-worldmap.png", SNAPSHOT_OPTS);
});

test("Workforce Entry: leaderboard-years panel", async ({ page }) => {
  await page.goto("workforce-entry/", { waitUntil: "networkidle" });
  const panel = page.locator('[data-exhibit-id="FIG302"]');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toHaveScreenshot("workforce-entry-fig302-leaderboard.png", SNAPSHOT_OPTS);
});

test("Research Output: ranked-bar hero panel", async ({ page }) => {
  await page.goto("research-output/", { waitUntil: "networkidle" });
  await expect(page.locator('[data-exhibit-id="TAB506"]')).toHaveScreenshot("research-output-tab506-rankedbar.png", SNAPSHOT_OPTS);
});

test("Retention & Immigration: Sankey hero panel", async ({ page }) => {
  await page.goto("retention-immigration/", { waitUntil: "networkidle" });
  const panel = page.locator(".panel").filter({ has: page.getByRole("heading", { name: "The Retention Gap" }) });
  await expect(panel).toHaveScreenshot("retention-immigration-sankey.png", SNAPSHOT_OPTS);
});
