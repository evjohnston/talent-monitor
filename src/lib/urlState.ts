import type { Stage } from "./types.ts";

// One dashboard route: the Overview, or one of the 6 pipeline stages. Each
// is now a real Astro page/URL (src/pages/) rather than a client-side tab
// switch, so this is just the shared "which page is active" type — no
// read/write-query-string helpers needed anymore (real navigation is a
// plain <a href>, see DashboardNav.astro).
export type Dashboard = "overview" | Stage;

const COUNTRY_PARAM = "country";

// TrackShell.tsx's click-to-pin state (see CLAUDE.md's "Click-to-pin"
// note), round-tripped through ?country=XX so a pinned view is a real,
// shareable/bookmarkable URL, not state that vanishes on reload. Guarded
// for SSR — Astro renders TrackShell's static markup at build time, when
// `window` doesn't exist; both functions are no-ops there, and the real
// read happens client-side after hydration (see TrackShell.tsx's mount
// effect) so the server-rendered "no pin" output and the client's first
// render still match, avoiding a hydration mismatch.
export function readPinnedCountryFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get(COUNTRY_PARAM);
  // Only a real 2-letter shape is trusted — a hand-edited/garbage
  // ?country= value falls through to "no pin" rather than being pinned
  // as-is and printing verbatim in the "Pinned: X" bar.
  return raw && /^[A-Za-z]{2}$/.test(raw) ? raw.toUpperCase() : null;
}

export function writePinnedCountryToUrl(code: string | null) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  if (code) p.set(COUNTRY_PARAM, code);
  else p.delete(COUNTRY_PARAM);
  const query = p.toString();
  // replaceState, not pushState — same reasoning readDashboard/
  // writeDashboard used to (see git history on this file): clicking
  // through several countries in a row shouldn't spam the back-button
  // history with one entry per click.
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}
