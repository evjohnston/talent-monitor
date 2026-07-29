import type { Exhibit } from "../lib/types.ts";
import { toSeriesChart, toCountryMapValues, toLeaderboardYears, toRankedBars, isRateShapedSeries } from "../lib/exhibitData.ts";
import { computeAiConferenceCatchUp } from "../lib/aiConferenceCatchUp.ts";
import { SeriesChart } from "./SeriesChart.tsx";
import { WorldMap } from "./WorldMap.tsx";
import { LeaderboardYears } from "./LeaderboardYears.tsx";
import { BarRow } from "./BarRow.tsx";

// Dispatches one real Exhibit to the chart shape that fits its `kind` (see
// scripts/import-talent-charts.ts for how `kind` gets assigned). Generic on
// purpose — this is what lets 6 new Track pages share one rendering path
// across ~80 differently-shaped real exhibits instead of one bespoke
// component per figure.
//
// `emphasize`/`onHoverCountry` are TrackShell's cross-highlight channel: a
// country hovered on one exhibit's map gets emphasized on every other
// country-shaped exhibit on the same page. Only country-map and
// timeseries/share-timeseries participate (a bare ranked-bar/leaderboard
// row isn't reliably a country), and only WorldMap broadcasts — see
// TrackShell.tsx for the shared state this all flows through.
// `onSelectCountry` is the same idea for a CLICK, not a hover — WorldMap's
// own onSelect prop, wired all the way through so a click pins the
// cross-highlight (see TrackShell.tsx's pinnedCountry state).
export function ExhibitChart({ exhibit, emphasize, onHoverCountry, onSelectCountry }: { exhibit: Exhibit; emphasize?: string[]; onHoverCountry?: (code: string | null) => void; onSelectCountry?: (code: string) => void }) {
  if (exhibit.kind === "timeseries" || exhibit.kind === "share-timeseries") {
    const { x, series } = toSeriesChart(exhibit);
    // share-timeseries exhibits store either a raw 0-1 fraction (needs
    // x100 to read as a percent) or an already-computed percentage point
    // (FIG207's columns are literally named "Percent of ... post-docs") —
    // detected from the real data range, not assumed from `kind` alone.
    const isFraction = exhibit.kind === "share-timeseries" && series.every((s) => s.values.every((v) => v == null || Math.abs(v) <= 1.5));
    const scaled = isFraction ? series.map((s) => ({ ...s, values: s.values.map((v) => (v == null ? null : v * 100)) })) : series;

    // A plain `timeseries` can still mix a real 0-1 rate column in among
    // count columns (FIG603: Received/Approved/Denied in the thousands
    // alongside an Approval Rate column never above 1) — a real bug,
    // caught by hand and flagged in content/report-crosswalk.csv's own
    // caveat: "count and rate must not share an axis." See
    // exhibitData.ts's isRateShapedSeries (and its own test file) for the
    // detection rule and why magnitude alone isn't enough.
    if (exhibit.kind === "timeseries" && scaled.length > 1) {
      const rateSeries = scaled.filter(isRateShapedSeries);
      const countSeries = scaled.filter((s) => !isRateShapedSeries(s));
      if (rateSeries.length > 0 && countSeries.length > 0) {
        return (
          <div className="count-rate-split">
            <SeriesChart x={x} series={countSeries} formatValue={(v) => v.toLocaleString()} emphasize={emphasize} />
            <div className="trend-note">Rate, same years, separate axis (a 0-1 rate can't share a scale with counts in the thousands):</div>
            <SeriesChart
              x={x}
              series={rateSeries.map((s) => ({ ...s, values: s.values.map((v) => (v == null ? null : v * 100)) }))}
              unitSuffix="%"
              formatValue={(v) => v.toFixed(1)}
              emphasize={emphasize}
            />
          </div>
        );
      }
    }

    return (
      <SeriesChart
        x={x}
        series={scaled}
        unitSuffix={exhibit.kind === "share-timeseries" ? "%" : ""}
        formatValue={(v) => (exhibit.kind === "share-timeseries" ? v.toFixed(1) : v.toLocaleString())}
        emphasize={emphasize}
      />
    );
  }

  if (exhibit.kind === "country-map") {
    const cm = toCountryMapValues(exhibit);
    if (!cm) return <div className="trend-empty">No data for this exhibit.</div>;
    // A score/rate/gap doesn't have a real zero floor the way a count does
    // (PISA means cluster ~400-600; a "gap with native-born" can go
    // negative) — detected from the real values, not assumed from `kind`.
    const vals = Object.values(cm.values);
    const min = vals.length ? Math.min(...vals) : 0;
    const max = vals.length ? Math.max(...vals) : 1;
    const mode = min < 0 || (max > 0 && min > max * 0.2) ? "range" : "count";
    return <WorldMap values={cm.values} unit={cm.column} mode={mode} emphasize={emphasize} onHoverCountry={onHoverCountry} onSelect={onSelectCountry} />;
  }

  if (exhibit.kind === "leaderboard-years") {
    const { years, rows } = toLeaderboardYears(exhibit);
    if (years.length === 0) return <div className="trend-empty">No data for this exhibit.</div>;
    return <LeaderboardYears years={years} rows={rows} nameLabel={exhibit.columns[0]} />;
  }

  // TAB501 — a real, justified one-off (see aiConferenceCatchUp.ts), same
  // house convention as FIG303's buildFig303: a genuinely unique exhibit
  // shape (one row per conference x year x country) gets its own real
  // derivation instead of the generic ranked-bar fallback flattening 454
  // rows into a meaningless flat-sorted list (confirmed broken: that's
  // the exhibit content/report-crosswalk.csv's own note says needs "a
  // real bespoke chart, not polish").
  if (exhibit.id === "TAB501") {
    const results = computeAiConferenceCatchUp(exhibit);
    if (results.length === 0) return <div className="trend-empty">No data for this exhibit.</div>;
    const maxLeadYears = Math.max(1, ...results.map((r) => (r.catchUpYear != null ? r.latestYear - r.catchUpYear : 0)));
    return (
      <div>
        {results.map((r) => {
          const leadYears = r.catchUpYear != null ? r.latestYear - r.catchUpYear : 0;
          const pctChina = (r.latestChinaShare * 100).toFixed(1);
          const pctUs = (r.latestUsShare * 100).toFixed(1);
          return (
            <BarRow
              key={r.conference}
              label={r.conference}
              pct={(leadYears / maxLeadYears) * 100}
              color="var(--country-cn)"
              valueLabel={r.catchUpYear != null ? `Caught up ${r.catchUpYear}` : "Not yet"}
              detail={
                r.catchUpYear != null
                  ? `${r.conference}: China's share overtook the US's in ${r.catchUpYear}. As of ${r.latestYear}, China ${pctChina}% vs. US ${pctUs}%.`
                  : `${r.conference}: China hasn't caught up as of ${r.latestYear} — China ${pctChina}% vs. US ${pctUs}%.`
              }
            />
          );
        })}
      </div>
    );
  }

  // ranked-bar, and the generic fallback for any shape that doesn't
  // cleanly fit the other four.
  const rb = toRankedBars(exhibit);
  if (!rb || rb.rows.length === 0) return <div className="trend-empty">No data for this exhibit.</div>;
  return (
    <div>
      {rb.rows.map((r, i) => (
        <BarRow
          key={`${r.label}-${i}`}
          label={r.label}
          // Real bug, caught by hand on TAB101 (a "percent change in
          // share" column, genuinely negative for fields that lost
          // international share): an unclamped negative pct sets an
          // inline `width: -N%`, which is invalid CSS — BarRow's `.fill`
          // has no CSS-class width fallback, so the browser drops the
          // whole declaration and the bar defaults to the FULL width of
          // its track, rendering a negative value as the single LONGEST
          // bar in the list. Clamped to 0 here — the real signed number
          // still shows in `valueLabel`, this only stops the bar itself
          // from lying about magnitude and direction.
          pct={Math.max(0, (r.value / rb.max) * 100)}
          color="var(--red)"
          valueLabel={r.value.toLocaleString()}
          detail={`${r.label} · ${r.value.toLocaleString()} (${rb.column})`}
        />
      ))}
      {rb.truncated > 0 && <div className="trend-note" style={{ marginTop: 6 }}>+{rb.truncated} more not shown.</div>}
    </div>
  );
}
