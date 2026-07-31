import { useEffect, useState } from "react";
import { countryName } from "../lib/countries.ts";
import { readPinnedCountriesFromUrl, writePinnedCountriesToUrl } from "../lib/urlState.ts";
import { emitPinnedCountriesChanged, onPinnedCountriesChanged } from "../lib/crossHighlightBus.ts";

// The real "Pinned:"/"Comparing:" bar (unchanged real behavior/markup
// from TrackShell.tsx's own original inline JSX) — extracted into its
// own small, always-`client:load` island once a stage page's exhibit
// panels became independent `client:visible` islands (issue #23's real
// TBT fix, see CLAUDE.md's "Chart-page performance" section). This bar
// isn't tied to any one exhibit, so it isn't a panel; it needs immediate
// interactivity (the remove-chip buttons), so it stays eager.
export function PinnedCountriesBar() {
  const [pinnedCountries, setPinnedCountries] = useState<string[]>([]);
  useEffect(() => {
    setPinnedCountries(readPinnedCountriesFromUrl());
    return onPinnedCountriesChanged(setPinnedCountries);
  }, []);

  function clearPin(code: string) {
    const next = pinnedCountries.filter((c) => c !== code);
    setPinnedCountries(next);
    writePinnedCountriesToUrl(next);
    emitPinnedCountriesChanged(next);
  }
  function clearAllPins() {
    setPinnedCountries([]);
    writePinnedCountriesToUrl([]);
    emitPinnedCountriesChanged([]);
  }

  if (pinnedCountries.length === 0) return null;
  return (
    <div className="pinned-country-bar">
      <span>{pinnedCountries.length > 1 ? "Comparing:" : "Pinned:"}</span>
      {pinnedCountries.map((code) => (
        <span className="pinned-country-chip" key={code}>
          {countryName(code)}
          <button type="button" aria-label={`Remove ${countryName(code)}`} onClick={() => clearPin(code)}>×</button>
        </span>
      ))}
      <span className="pinned-country-hint">highlighted on every map/chart below</span>
      {pinnedCountries.length > 1 && (
        <button type="button" className="ghost-btn" onClick={clearAllPins}>Clear all</button>
      )}
      {pinnedCountries.length === 1 && (
        <button type="button" className="ghost-btn" onClick={clearAllPins}>Clear</button>
      )}
    </div>
  );
}
