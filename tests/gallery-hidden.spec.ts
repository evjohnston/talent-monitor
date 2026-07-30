import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// A real production build (this repo's normal build-and-deploy.yml never
// sets PUBLIC_ENABLE_DEV_GALLERY) must show the plain "not available"
// notice, not the real gallery content — see src/pages/dev/components.astro's
// own comment. This runs against the SAME default/flag-off server every
// other test in tests/ (excluding tests/gallery/**) already uses.
test("component gallery route shows the production placeholder, not real content", async ({ page }) => {
  await page.goto("dev/components/", { waitUntil: "networkidle" });
  await expect(page.getByText("This page is only available")).toBeVisible();
  await expect(page.locator('[data-exhibit-id="GAL-TS-SMALL"]')).toHaveCount(0);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, results.violations.map((v) => v.id).join(", ")).toEqual([]);
});
