import { test, expect } from "@playwright/test";

// Real checks against a PUBLIC_ENABLE_DATA_REVIEW=true build (see
// playwright.data-review.config.ts) — the one build state where
// src/pages/dev/data-review.astro renders its real content.

test("renders real review records, not the production placeholder", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("dev/data-review/", { waitUntil: "networkidle" });

  await expect(page.getByText(/\d+ real exhibits reviewed/)).toBeVisible();
  await expect(page.getByText("This page is only available")).toHaveCount(0);
  await expect(page.locator("table.downloads-table tbody tr").first()).toBeVisible();

  expect(errors, errors.join("\n")).toEqual([]);
});

test("search filters the real table by exhibit id, title, or source", async ({ page }) => {
  await page.goto("dev/data-review/", { waitUntil: "networkidle" });
  const rows = page.locator("table.downloads-table tbody tr");
  const totalRows = await rows.count();
  expect(totalRows).toBeGreaterThan(1);

  await page.getByRole("searchbox").fill("FIG101");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("FIG101");
});

test("a row's detail disclosure is keyboard-operable", async ({ page }) => {
  await page.goto("dev/data-review/", { waitUntil: "networkidle" });
  // Pinned to a specific row rather than a fresh "button named Show"
  // query — the button's own accessible name changes to "Hide" the
  // instant it's activated, so re-resolving ".first()" by that same name
  // afterward would silently shift to the NEXT row's still-"Show" button.
  const firstRow = page.locator("table.downloads-table tbody tr").first();
  const button = firstRow.getByRole("button");
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveText("Hide");
  await expect(firstRow.getByText("Report reference")).toBeVisible();
});
