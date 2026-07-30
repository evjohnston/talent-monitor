import type { Stage } from "./types.ts";

// Explorer catalog + detail-view + compare-mode state (issue #18, all
// three planned PRs — country/field/degree/year are a real, smaller,
// disclosed gap: cross-exhibit comparison here compares whole indicators
// side by side, not a within-exhibit country/field breakdown, which
// already exists elsewhere in this app via TrackShell's own pinned-
// countries mechanism). Same SSR-safe pattern already established for
// pinned countries (urlState.ts) and the Overview's scrollytelling step
// param — default parameters are omitted from the URL, invalid values
// are dropped rather than trusted verbatim.
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
  // Up to 4 real exhibit ids selected for compare mode — real, shareable
  // via ?compare=A,B,C,D. Selection itself (adding/removing an id) is an
  // ordinary filter-like tweak (replaceState); entering the actual
  // compare VIEW is a real navigation (pushState), same real distinction
  // metric detail already established.
  compare: string[];
  view: "catalog" | "compare";
}

export const DEFAULT_EXPLORER_FILTERS: ExplorerFilters = { q: "", stage: "all", topic: "all", sort: "report-order", metric: null, compare: [], view: "catalog" };

export const MAX_COMPARE = 4;

const VALID_STAGES = new Set(["foundation", "degree-production", "graduate-training", "workforce-entry", "retention-immigration", "research-output"]);
const VALID_SORTS = new Set(["report-order", "alphabetical", "longest-series"]);

export function readExplorerFiltersFromUrl(): ExplorerFilters {
  if (typeof window === "undefined") return DEFAULT_EXPLORER_FILTERS;
  const params = new URLSearchParams(window.location.search);
  const stage = params.get("stage") ?? "all";
  const sort = params.get("sort") ?? "report-order";
  const compare = (params.get("compare") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_COMPARE);
  const view = params.get("view") === "compare" ? "compare" : "catalog";
  return {
    q: params.get("q") ?? "",
    stage: stage === "all" || VALID_STAGES.has(stage) ? (stage as Stage | "all") : "all",
    topic: params.get("topic") ?? "all",
    sort: VALID_SORTS.has(sort) ? (sort as ExplorerFilters["sort"]) : "report-order",
    metric: params.get("metric"),
    compare,
    view,
  };
}

// `push`: true when opening/closing the focused detail view or entering/
// leaving compare mode (a real navigation a reader would expect the back
// button to undo), false for ordinary filter tweaks (typing in search,
// clicking a dropdown, adding/removing a compare selection) where
// replaceState avoids spamming history with one entry per click — same
// real distinction pinned countries/scrollytelling never needed (neither
// of them has a real sub-view to navigate into).
export function writeExplorerFiltersToUrl(filters: ExplorerFilters, push = false) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.stage !== "all") p.set("stage", filters.stage);
  if (filters.topic !== "all") p.set("topic", filters.topic);
  if (filters.sort !== "report-order") p.set("sort", filters.sort);
  if (filters.metric) p.set("metric", filters.metric);
  if (filters.compare.length > 0) p.set("compare", filters.compare.join(","));
  if (filters.view !== "catalog") p.set("view", filters.view);
  const query = p.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
  if (push) window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}
