import { defineConfig } from "@playwright/test";

// A separate config from playwright.config.ts because the component
// gallery route (src/pages/dev/components.astro) only renders real
// content in a build with PUBLIC_ENABLE_DEV_GALLERY=true — a normal
// production build (what the main config's webServer produces) always
// shows the "not available" placeholder instead (see that route's own
// comment). Rebuilding here rather than sharing dist/ with the main
// config keeps the two test runs' server state honestly separate; the
// rebuild itself is fast (~1.5s for this site).
const base = process.env.GTM_BASE ?? "/";

export default defineConfig({
  testDir: "./tests/gallery",
  webServer: {
    command: "PUBLIC_ENABLE_DEV_GALLERY=true npm run build && npm run preview",
    url: `http://localhost:4321${base}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: `http://localhost:4321${base}`,
  },
});
