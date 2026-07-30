import type { Stage } from "./types.ts";

// Explorer catalog state (issue #18, PR "explorer foundation" — q/stage/
// topic/sort only; metric/country/field/degree/year/compare/view are a
// later PR's own indicator-detail/compare-mode state, not built yet).
// Same SSR-safe, replaceState-only pattern already established for
// pinned countries (urlState.ts) and the Overview's scrollytelling step
// param — default parameters are omitted from the URL, invalid values
// are dropped rather than trusted verbatim.
export interface ExplorerFilters {
  q: string;
  stage: Stage | "all";
  topic: string | "all";
  sort: "report-order" | "alphabetical" | "longest-series";
}

export const DEFAULT_EXPLORER_FILTERS: ExplorerFilters = { q: "", stage: "all", topic: "all", sort: "report-order" };

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
  };
}

export function writeExplorerFiltersToUrl(filters: ExplorerFilters) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.stage !== "all") p.set("stage", filters.stage);
  if (filters.topic !== "all") p.set("topic", filters.topic);
  if (filters.sort !== "report-order") p.set("sort", filters.sort);
  const query = p.toString();
  // replaceState — same reasoning as pinned countries/scrollytelling
  // steps: typing in the search box or clicking through filters
  // shouldn't spam the back-button history with one entry per keystroke.
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}
