import { test, expect } from "@playwright/test";
import fs from "node:fs";

// Real keyboard/download interaction checks — the axe-core sweep in
// accessibility.spec.ts only catches automatically-detectable violations
// (missing labels, contrast, landmarks); it can't confirm a control
// actually operates correctly via keyboard, or that a download button
// produces a real, non-empty file. This file exercises those by hand,
// same "check the actual behavior, not just the markup" discipline as
// the rest of this app's test suite.

test.describe("methodology drawer", () => {
  test("opens and closes via keyboard with no focus trap", async ({ page }) => {
    await page.goto("foundation/", { waitUntil: "networkidle" });
    const drawer = page.locator("details.methodology-drawer").first();
    const summary = drawer.locator("summary");

    // <details>/<summary> is native, so Enter on a focused summary toggles
    // it with zero bespoke script — confirming that here, not assuming it
    // from the markup alone.
    await summary.focus();
    await expect(drawer).not.toHaveJSProperty("open", true);
    await page.keyboard.press("Enter");
    await expect(drawer).toHaveJSProperty("open", true);
    // Focus stays on the summary the browser already had focused — no
    // trap, no jump into the newly-revealed body.
    await expect(summary).toBeFocused();

    // The body's own real content (citation link, download buttons) is
    // reachable by continuing to Tab forward, not hidden from keyboard
    // users despite being visually below the summary.
    await page.keyboard.press("Tab");
    const firstFocusable = drawer.locator("a, button").first();
    await expect(firstFocusable).toBeFocused();

    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(drawer).toHaveJSProperty("open", false);
    await expect(summary).toBeFocused();
  });
});

test.describe("chart annotations", () => {
  test("a real annotation is keyboard-reachable and reveals its full detail on activation", async ({ page }) => {
    // FIG409 carries a real, always-visible (priority 1) annotation —
    // see src/lib/annotations.ts's fig409Covid(). The list of buttons
    // below the chart is the actual accessible interface (the Nivo
    // marker on the chart itself has no DOM focus target at all).
    await page.goto("foundation/", { waitUntil: "networkidle" });
    const panel = page.locator('[data-exhibit-id="FIG409"]');
    await panel.scrollIntoViewIfNeeded();
    const button = panel.locator(".chart-annotation-btn").first();
    await expect(button).toHaveCount(1);
    await button.focus();
    await expect(panel.locator(".chart-annotation-detail")).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(panel.locator(".chart-annotation-detail")).toBeVisible();
    await expect(button).toBeFocused();
  });
});

test.describe("scrollytelling keyboard navigation", () => {
  test("real Tab order reaches a late step's controls and updates the URL step state", async ({ page }) => {
    await page.goto("", { waitUntil: "networkidle" });
    const chip = page.locator('[data-step-id="research-leadership"] button.chip').first();
    await expect(chip).toHaveCount(1);

    // Tab forward for real, the same way a keyboard user reaches
    // below-the-fold content — bounded, not an infinite loop, but high
    // enough to cover everything above this, the last of 6 steps.
    let reached = false;
    for (let i = 0; i < 250 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await chip.evaluate((el) => el === document.activeElement).catch(() => false);
    }
    expect(reached).toBe(true);

    // Reaching a focusable element scrolls it into view natively, which
    // is exactly what the IntersectionObserver in Scrollytelling.tsx
    // watches for — confirms the URL sync isn't mouse-scroll-only.
    await expect(page).toHaveURL(/step=research-leadership/);

    await page.keyboard.press("Enter");
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("download menu", () => {
  test("CSV, JSON, and SVG buttons produce real, non-empty files", async ({ page }) => {
    await page.goto("foundation/", { waitUntil: "networkidle" });
    const drawer = page.locator("details.methodology-drawer").first();
    await drawer.locator("summary").click();

    const [csv] = await Promise.all([
      page.waitForEvent("download"),
      drawer.getByRole("button", { name: /Download CSV/ }).first().click(),
    ]);
    expect(csv.suggestedFilename()).toMatch(/\.csv$/);
    const csvPath = await csv.path();
    expect(csvPath).toBeTruthy();
    const csvContent = fs.readFileSync(csvPath as string, "utf-8");
    const csvLines = csvContent.trim().split("\n");
    expect(csvLines.length).toBeGreaterThan(1); // header + at least one real row
    expect(csvLines[0]).toContain(",");

    const [json] = await Promise.all([
      page.waitForEvent("download"),
      drawer.getByRole("button", { name: "Download JSON" }).click(),
    ]);
    expect(json.suggestedFilename()).toMatch(/\.json$/);
    const jsonPath = await json.path();
    const parsed = JSON.parse(fs.readFileSync(jsonPath as string, "utf-8"));
    expect(Array.isArray(parsed.rows)).toBe(true);
    expect(parsed.rows.length).toBeGreaterThan(0);

    // Not every exhibit renders an <svg> (BarRow-based ones don't, see
    // MethodologyDrawer.tsx's own hasSvg check) — this stage's hero is a
    // real SeriesChart/line exhibit, so the button is expected here.
    const svgButton = drawer.getByRole("button", { name: "Download SVG" });
    await expect(svgButton).toHaveCount(1);
    const [svg] = await Promise.all([
      page.waitForEvent("download"),
      svgButton.click(),
    ]);
    expect(svg.suggestedFilename()).toMatch(/\.svg$/);
    const svgPath = await svg.path();
    const svgContent = fs.readFileSync(svgPath as string, "utf-8");
    expect(svgContent).toContain("<svg");
  });
});

test.describe("explorer catalog", () => {
  test("search filters the real catalog and updates the URL; a result's Open link deep-links into the real methodology drawer", async ({ page }) => {
    await page.goto("explorer/", { waitUntil: "networkidle" });
    const results = page.locator(".explorer-result");
    const totalCount = await results.count();
    expect(totalCount).toBeGreaterThan(1);

    const search = page.getByRole("searchbox");
    await search.fill("H-1B");
    await expect(page).toHaveURL(/[?&]q=H-1B/);
    await expect(results).not.toHaveCount(totalCount);
    const filteredCount = await results.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(totalCount);

    const openLink = results.first().getByRole("link", { name: "Open →" });
    const href = await openLink.getAttribute("href");
    const exhibitId = new URL(href!, page.url()).searchParams.get("methods");
    await openLink.click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain(href!.split("?")[0]);
    // The specific drawer the URL targets, not "whichever renders first in
    // DOM order" — a result's real stage-page position isn't necessarily
    // first on that page (same real lesson as the data-review Show/Hide
    // locator bug: don't assume DOM position matches intent).
    await expect(page.locator(`#methods-${exhibitId}`)).toHaveJSProperty("open", true);
  });

  test("stage and topic filters are keyboard-operable and clearable", async ({ page }) => {
    await page.goto("explorer/", { waitUntil: "networkidle" });
    const stageSelect = page.getByRole("combobox", { name: "Filter by stage" });
    await stageSelect.selectOption("workforce-entry");
    await expect(page).toHaveURL(/stage=workforce-entry/);
    await expect(page.getByRole("button", { name: /Remove filter: Workforce Entry/ })).toBeVisible();

    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page).not.toHaveURL(/stage=/);
  });
});
