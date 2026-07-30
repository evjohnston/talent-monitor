import { defineConfig } from "@playwright/test";

// Same GTM_BASE env var astro.config.mjs itself reads — CI's Build step
// sets it to /<repo-name>/ (see build-and-deploy.yml) and `astro preview`
// serves dist/ under that same base path, not root. A hardcoded
// "http://localhost:4321/" baseURL would 404 on every route in CI (real
// bug caught by hand: confirmed astro preview honors `base` the same way
// production does) — reading the same env var here keeps local runs
// (GTM_BASE unset, base "/") and CI runs pointed at whatever the actual
// build just produced.
const base = process.env.GTM_BASE ?? "/";

// Astro's own default preview port — matches astro.config.mjs (no
// explicit port override there) and CLAUDE.md's own note on the dev
// server's default port. `webServer` assumes `dist/` already exists
// (run `npm run build` first, same as CI's own Build-then-test order in
// .github/workflows/build-and-deploy.yml) rather than building here too
// — a real build already runs earlier in that same job, so doing it
// again would just double the wait for no reason.
export default defineConfig({
  testDir: "./tests",
  webServer: {
    command: "npm run preview",
    url: `http://localhost:4321${base}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  use: {
    baseURL: `http://localhost:4321${base}`,
  },
});
