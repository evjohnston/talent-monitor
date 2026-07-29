import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// Same base-path convention the old vite.config.ts used: unset for local
// dev / a root domain, "/<repo>/" for GitHub Pages (set by
// build-and-deploy.yml's Build step via GTM_BASE — unchanged by this
// migration).
const base = process.env.GTM_BASE ?? "/";

export default defineConfig({
  base,
  output: "static",
  integrations: [react()],
});
