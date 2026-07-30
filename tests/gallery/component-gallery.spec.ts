import { test, expect } from "@playwright/test";

// Real checks against a PUBLIC_ENABLE_DEV_GALLERY=true build (see
// playwright.gallery.config.ts) — this is the one build state where
// src/pages/dev/components.astro renders its real content, so this is
// the only place these checks can run.

test("renders real content, not the production placeholder", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("dev/components/", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "Foundations", level: 2 })).toBeVisible();
  await expect(page.getByText("This page is only available")).toHaveCount(0);
  // A real fixture exhibit panel, dispatched through the actual ExhibitPanel/ExhibitChart.
  await expect(page.locator('[data-exhibit-id="GAL-TS-SMALL"]')).toBeVisible();

  expect(errors, errors.join("\n")).toEqual([]);
});

test("no fixture fetches to third-party services", async ({ page }) => {
  const crossOrigin: string[] = [];
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.hostname !== "localhost") crossOrigin.push(req.url());
  });
  await page.goto("dev/components/", { waitUntil: "networkidle" });
  expect(crossOrigin, crossOrigin.join("\n")).toEqual([]);
});

test("a methodology drawer example is keyboard-operable", async ({ page }) => {
  await page.goto("dev/components/", { waitUntil: "networkidle" });
  const drawer = page.locator("details.methodology-drawer").first();
  const summary = drawer.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(drawer).toHaveJSProperty("open", true);
  await expect(summary).toBeFocused();
});

test.describe("visual regression", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  const VIEWPORTS: { name: string; width: number; height: number }[] = [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "tablet", width: 1024, height: 768 },
    { name: "mobile", width: 390, height: 844 },
  ];

  for (const vp of VIEWPORTS) {
    test(`gallery top section at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("dev/components/", { waitUntil: "networkidle" });
      await expect(page).toHaveScreenshot(`gallery-${vp.name}.png`, { maxDiffPixelRatio: 0.02 });
    });
  }
});
