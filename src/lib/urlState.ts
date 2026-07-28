import type { Stage } from "./types.ts";

// One dashboard tab: the Overview, or one of the 6 pipeline stages.
export type Dashboard = "overview" | Stage;
const VALID_DASHBOARDS = new Set<Dashboard>([
  "overview", "foundation", "degree-production", "graduate-training",
  "workforce-entry", "retention-immigration", "research-output",
]);

export function readDashboard(): Dashboard {
  const raw = new URLSearchParams(window.location.search).get("dashboard") as Dashboard | null;
  return raw && VALID_DASHBOARDS.has(raw) ? raw : "overview";
}

// replaceState, not pushState — a tab switch is real navigation the user
// may want back/forward for, but every dashboard read of the URL is cheap
// enough that history-spamming isn't worth the tradeoff for a single flag.
export function writeDashboard(dashboard: Dashboard) {
  const p = new URLSearchParams(window.location.search);
  if (dashboard === "overview") p.delete("dashboard");
  else p.set("dashboard", dashboard);
  const query = p.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}
