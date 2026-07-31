import { useEffect, useState } from "react";
import type { Exhibit } from "../lib/types.ts";
import type { ChartAnnotation } from "../lib/annotations.ts";
import { readPinnedCountriesFromUrl, writePinnedCountriesToUrl } from "../lib/urlState.ts";
import { emitHoverCountry, onHoverCountry, emitPinnedCountriesChanged, onPinnedCountriesChanged } from "../lib/crossHighlightBus.ts";
import { ExhibitPanel } from "./ExhibitPanel.tsx";

// One exhibit panel, independently mountable as its own real Astro island
// (issue #23's own real TBT fix — see CLAUDE.md's "Chart-page
// performance" section). Before this, every panel on a stage page was a
// plain React child inside ONE big island (TrackShell.tsx), so a real
// Lighthouse profile confirmed ~18 Nivo chart instances all computing
// their own scales/paths SYNCHRONOUSLY the instant that one island
// hydrated — the actual, measured cause of this app's real Total
// Blocking Time problem, not general app code. A stage page's own
// below-the-fold panels now use `client:visible` (deferring that same
// real computation until they actually scroll into view); the hero panel
// (already visible on load) stays `client:load`.
//
// Splitting one shared island into many independent ones means
// TrackShell's own real cross-highlight state (hover-emphasize, click-
// to-pin/compare) can no longer live in one shared React tree — each
// panel now owns its own local copy, kept in sync via crossHighlightBus's
// plain CustomEvents (pinned countries) and a real, already-existing URL
// read on mount (readPinnedCountriesFromUrl — the same real source of
// truth every panel already agreed on before this split).
export function ExhibitPanelIsland({
  exhibit,
  annotations,
  headingLevel,
}: {
  exhibit: Exhibit;
  annotations?: ChartAnnotation[];
  headingLevel?: 2 | 3;
}) {
  const [emphasizeCountry, setEmphasizeCountry] = useState<string | null>(null);
  // Starts empty on both server and first client render — no hydration
  // mismatch — then a mount effect reads the real, already-pinned URL
  // state, same SSR-safe pattern TrackShell.tsx already established.
  const [pinnedCountries, setPinnedCountries] = useState<string[]>([]);
  useEffect(() => {
    setPinnedCountries(readPinnedCountriesFromUrl());
    const offHover = onHoverCountry(setEmphasizeCountry);
    const offPin = onPinnedCountriesChanged(setPinnedCountries);
    return () => {
      offHover();
      offPin();
    };
  }, []);

  const effectiveCountries = emphasizeCountry ? [emphasizeCountry] : pinnedCountries;
  const emphasize = effectiveCountries.length > 0 ? effectiveCountries : undefined;

  function handleHover(code: string | null) {
    setEmphasizeCountry(code);
    emitHoverCountry(code);
  }
  function handleSelect(code: string) {
    const next = pinnedCountries.includes(code) ? pinnedCountries.filter((c) => c !== code) : [...pinnedCountries, code];
    setPinnedCountries(next);
    writePinnedCountriesToUrl(next);
    emitPinnedCountriesChanged(next);
  }

  return (
    <ExhibitPanel
      exhibit={exhibit}
      emphasize={emphasize}
      onHoverCountry={handleHover}
      onSelectCountry={handleSelect}
      annotations={annotations}
      headingLevel={headingLevel}
    />
  );
}
