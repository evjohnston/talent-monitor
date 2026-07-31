// A real, minimal cross-island communication channel for TrackShell's own
// cross-highlight state (hover-emphasize + click-to-pin/compare), needed
// once each stage page's panels became independent Astro islands
// (client:visible, issue #23's own real TBT fix — see CLAUDE.md's
// "Chart-page performance" section) instead of one shared React tree.
// Plain browser CustomEvents, not a state-management library — this app
// has exactly two real cross-panel signals to carry, and native events
// are the standard, dependency-free way to communicate across island
// boundaries that don't share React context.
const HOVER_EVENT = "gtm:hover-country";
const PIN_EVENT = "gtm:pinned-countries-changed";

// Hover-emphasize is genuinely ephemeral (never URL-persisted) — a panel
// that isn't hydrated yet (still below the fold, `client:visible` hasn't
// triggered) simply isn't listening, which is correct: a reader can't see
// an unhydrated panel highlighting anyway.
export function emitHoverCountry(code: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string | null>(HOVER_EVENT, { detail: code }));
}

export function onHoverCountry(callback: (code: string | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => callback((e as CustomEvent<string | null>).detail);
  window.addEventListener(HOVER_EVENT, handler);
  return () => window.removeEventListener(HOVER_EVENT, handler);
}

// Pinned/compare countries are already real, URL-persisted state
// (urlState.ts's own readPinnedCountriesFromUrl/writePinnedCountriesToUrl)
// — but `history.replaceState` never fires a `popstate` event by spec, so
// a second island has no way to learn the URL changed unless the island
// that made the change also broadcasts it directly.
export function emitPinnedCountriesChanged(codes: string[]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string[]>(PIN_EVENT, { detail: codes }));
}

export function onPinnedCountriesChanged(callback: (codes: string[]) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => callback((e as CustomEvent<string[]>).detail);
  window.addEventListener(PIN_EVENT, handler);
  return () => window.removeEventListener(PIN_EVENT, handler);
}
