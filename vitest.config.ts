import { defineConfig, configDefaults } from "vitest/config";

// Needed for exactly one reason: Vitest's default test glob
// (**/*.{test,spec}.ts) also matches tests/accessibility.spec.ts, the
// committed Playwright/axe-core suite — which uses @playwright/test's
// own `test`/`expect`, not Vitest's, and errors if Vitest tries to run
// it. Spreading `configDefaults.exclude` (not writing a bare array) is
// deliberate — a real bug caught by hand: a plain `["tests/**"]` here
// REPLACES Vitest's own default excludes instead of adding to them, and
// Vitest's default only excludes root-level `node_modules`, not a nested
// one — this repo still has a real `worker/node_modules/` (from before
// the worker/ deletion, see CLAUDE.md), and vitest started trying to run
// `worker/node_modules/wrangler`'s own bundled test files before this
// fix. src/lib/*.test.ts still needs no other config beyond this one
// exclusion (see CLAUDE.md's "Tests" section).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "tests/**"],
  },
});
