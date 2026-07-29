import type { Stage } from "./types.ts";

// One dashboard route: the Overview, or one of the 6 pipeline stages. Each
// is now a real Astro page/URL (src/pages/) rather than a client-side tab
// switch, so this is just the shared "which page is active" type — no
// read/write-query-string helpers needed anymore (real navigation is a
// plain <a href>, see DashboardNav.astro).
export type Dashboard = "overview" | Stage;
