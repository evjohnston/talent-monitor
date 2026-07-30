import { defineConfig } from "@playwright/test";

// A separate config from playwright.config.ts for the same real reason
// playwright.gallery.config.ts is separate — src/pages/dev/data-review.astro
// only renders real content in a build with PUBLIC_ENABLE_DATA_REVIEW=true.
const base = process.env.GTM_BASE ?? "/";

export default defineConfig({
  testDir: "./tests/data-review",
  webServer: {
    command: "PUBLIC_ENABLE_DATA_REVIEW=true npm run build && npm run preview",
    url: `http://localhost:4321${base}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: `http://localhost:4321${base}`,
  },
});
