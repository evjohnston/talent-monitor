import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// A real production build (build-and-deploy.yml never sets
// PUBLIC_ENABLE_DATA_REVIEW) must show the plain "not available" notice,
// not the real review sheet — see src/pages/dev/data-review.astro's own
// comment. Same real pattern as tests/gallery-hidden.spec.ts.
test("data review sheet shows the production placeholder, not real content", async ({ page }) => {
  await page.goto("dev/data-review/", { waitUntil: "networkidle" });
  await expect(page.getByText("This page is only available")).toBeVisible();
  await expect(page.getByText("real exhibits reviewed")).toHaveCount(0);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, results.violations.map((v) => v.id).join(", ")).toEqual([]);
});
