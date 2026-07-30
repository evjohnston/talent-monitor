import type { Stage } from "./types.ts";

// Explorer catalog + detail-view state (issue #18 — country/field/degree/
// year/compare/view are a later PR's own compare-mode state, not built
// yet). Same SSR-safe pattern already established for pinned countries
// (urlState.ts) and the Overview's scrollytelling step param — default
// parameters are omitted from the URL, invalid values are dropped rather
// than trusted verbatim.
export interface ExplorerFilters {
  q: string;
  stage: Stage | "all";
  topic: string | "all";
  sort: "report-order" | "alphabetical" | "longest-series";
  // The focused indicator detail view's own real exhibit id — null means
  // "show the catalog." A real, shareable URL: opening a link with
  // ?metric=FIG101 lands directly on that indicator's own detail view,
  // not the catalog. Kept separate from `q`/`stage`/`topic` so a reader
  // can open a detail view, then use the browser's own back button to
  // return to whatever catalog filters were active before.
  metric: string | null;
}

export const DEFAULT_EXPLORER_FILTERS: ExplorerFilters = { q: "", stage: "all", topic: "all", sort: "report-order", metric: null };

const VALID_STAGES = new Set(["foundation", "degree-production", "graduate-training", "workforce-entry", "retention-immigration", "research-output"]);
const VALID_SORTS = new Set(["report-order", "alphabetical", "longest-series"]);

export function readExplorerFiltersFromUrl(): ExplorerFilters {
  if (typeof window === "undefined") return DEFAULT_EXPLORER_FILTERS;
  const params = new URLSearchParams(window.location.search);
  const stage = params.get("stage") ?? "all";
  const sort = params.get("sort") ?? "report-order";
  return {
    q: params.get("q") ?? "",
    stage: stage === "all" || VALID_STAGES.has(stage) ? (stage as Stage | "all") : "all",
    topic: params.get("topic") ?? "all",
    sort: VALID_SORTS.has(sort) ? (sort as ExplorerFilters["sort"]) : "report-order",
    metric: params.get("metric"),
  };
}

// `push`: true when opening/closing the focused detail view (a real
// navigation a reader would expect the back button to undo), false for
// ordinary filter tweaks (typing in search, clicking a dropdown) where
// replaceState avoids spamming history with one entry per keystroke —
// same real distinction pinned countries/scrollytelling never needed
// (neither of them has a real "detail view" to navigate into).
export function writeExplorerFiltersToUrl(filters: ExplorerFilters, push = false) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.stage !== "all") p.set("stage", filters.stage);
  if (filters.topic !== "all") p.set("topic", filters.topic);
  if (filters.sort !== "report-order") p.set("sort", filters.sort);
  if (filters.metric) p.set("metric", filters.metric);
  const query = p.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
  if (push) window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}
