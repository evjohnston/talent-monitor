import type { Stage } from "./types.ts";

// One dashboard route: the Overview, or one of the 6 pipeline stages. Each
// is now a real Astro page/URL (src/pages/) rather than a client-side tab
// switch, so this is just the shared "which page is active" type — no
// read/write-query-string helpers needed anymore (real navigation is a
// plain <a href>, see DashboardNav.astro).
export type Dashboard = "overview" | Stage | "methodology" | "downloads";

const COUNTRIES_PARAM = "countries";
// The original single-country param, from before country-compare mode
// (see CLAUDE.md's "Click-to-pin" note) generalized one pin into a real
// list. Still READ, for backward compatibility with any already-shared
// ?country=XX link, but never WRITTEN — every pin/compare action from
// here on produces a real ?countries=XX,YY link instead.
const LEGACY_COUNTRY_PARAM = "country";

function isCountryCode(v: string): boolean {
  return /^[A-Za-z]{2}$/.test(v);
}

// TrackShell.tsx's click-to-pin/compare state, round-tripped through
// ?countries=US,CN so a pinned/compared view is a real, shareable/
// bookmarkable URL, not state that vanishes on reload. Guarded for SSR —
// Astro renders TrackShell's static markup at build time, when `window`
// doesn't exist; both functions are no-ops there, and the real read
// happens client-side after hydration (see TrackShell.tsx's mount effect)
// so the server-rendered "no pin" output and the client's first render
// still match, avoiding a hydration mismatch.
export function readPinnedCountriesFromUrl(): string[] {
  if (typeof window === "undefined") return [];
  const params = new URLSearchParams(window.location.search);
  const fromNew = (params.get(COUNTRIES_PARAM) ?? "").split(",").map((s) => s.trim()).filter(isCountryCode);
  const fromLegacy = params.get(LEGACY_COUNTRY_PARAM);
  const merged = fromLegacy && isCountryCode(fromLegacy) ? [...fromNew, fromLegacy] : fromNew;
  // Only a real 2-letter shape is trusted per entry — a hand-edited/
  // garbage value is dropped rather than pinned as-is and printed
  // verbatim in the "Pinned" bar. De-duplicated, uppercased.
  return [...new Set(merged.map((c) => c.toUpperCase()))];
}

export function writePinnedCountriesToUrl(codes: string[]) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  p.delete(LEGACY_COUNTRY_PARAM);
  if (codes.length > 0) p.set(COUNTRIES_PARAM, codes.join(","));
  else p.delete(COUNTRIES_PARAM);
  const query = p.toString();
  // replaceState, not pushState — same reasoning readDashboard/
  // writeDashboard used to (see git history on this file): clicking
  // through several countries in a row shouldn't spam the back-button
  // history with one entry per click.
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}
