import type { Exhibit } from "../lib/types.ts";
import { toSeriesChart, toCountryMapValues, toLeaderboardYears, toRankedBars, toDistributionStats, isRateShapedSeries } from "../lib/exhibitData.ts";
import { computeAiConferenceCatchUp } from "../lib/aiConferenceCatchUp.ts";
import { annotationsForExhibit, type ChartAnnotation } from "../lib/annotations.ts";
import { SeriesChart } from "./SeriesChart.tsx";
import { WorldMap } from "./WorldMap.tsx";
import { LeaderboardYears } from "./LeaderboardYears.tsx";
import { BarRow } from "./BarRow.tsx";
import { BoxPlotRow } from "./BoxPlotRow.tsx";

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
//
// `onVisibleDataChange` reports the real, currently-displayed row subset
// up to MethodologyDrawer's download menu — only timeseries/share-
// timeseries (via SeriesChart's own >6-series picker) and leaderboard-
// years (always one year, top-N ranked) ever report anything narrower
// than the exhibit's full rows; every other chart kind shows everything
// it has, so "displayed" and "complete" are the same set and this is
// simply never called. Not wired for the count/rate-split path (two
// independent SeriesChart pickers) — a real, smaller gap, not silently
// papered over: see CLAUDE.md's "Per-chart downloads" note.
export function ExhibitChart({ exhibit, emphasize, onHoverCountry, onSelectCountry, onVisibleDataChange, annotations = [] }: { exhibit: Exhibit; emphasize?: string[]; onHoverCountry?: (code: string | null) => void; onSelectCountry?: (code: string) => void; onVisibleDataChange?: (rows: Record<string, unknown>[] | null) => void; annotations?: ChartAnnotation[] }) {
  const exhibitAnnotations = annotationsForExhibit(annotations, exhibit.id);
  if (exhibit.kind === "timeseries" || exhibit.kind === "share-timeseries") {
    const { x, series } = toSeriesChart(exhibit);
    const xKey = exhibit.columns[0];
    const reportVisibleSeries = (keys: string[]) => {
      if (!onVisibleDataChange) return;
      // Reports null (no real subset) whenever every series is visible —
      // the common case (≤6 series, no picker at all) — rather than a
      // "narrower" row-set that happens to have the same real content,
      // so MethodologyDrawer only shows a second download button when
      // there's a genuine difference to download.
      if (keys.length >= series.length) { onVisibleDataChange(null); return; }
      const keySet = new Set(keys);
      onVisibleDataChange(exhibit.rows.map((r) => {
        const row: Record<string, unknown> = { [xKey]: r[xKey] };
        for (const k of keySet) row[k] = r[k];
        return row;
      }));
    };
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
            <SeriesChart x={x} series={countSeries} formatValue={(v) => v.toLocaleString()} emphasize={emphasize} ariaLabel={`${exhibit.title} — counts`} annotations={exhibitAnnotations} />
            <div className="trend-note">Rate, same years, separate axis (a 0-1 rate can't share a scale with counts in the thousands):</div>
            <SeriesChart
              x={x}
              series={rateSeries.map((s) => ({ ...s, values: s.values.map((v) => (v == null ? null : v * 100)) }))}
              unitSuffix="%"
              formatValue={(v) => v.toFixed(1)}
              emphasize={emphasize}
              ariaLabel={`${exhibit.title} — rate`}
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
        ariaLabel={exhibit.title}
        onVisibleSeriesChange={reportVisibleSeries}
        annotations={exhibitAnnotations}
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
    return (
      <LeaderboardYears
        years={years}
        rows={rows}
        nameLabel={exhibit.columns[0]}
        onVisibleRowsChange={(visible) => onVisibleDataChange?.(visible.map((r) => ({ ...r })))}
      />
    );
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
        {/* TAB501 isn't a SeriesChart (see this branch's own note above),
            so its real registered annotation (annotations.ts's own
            tab501Crossing) can't use SeriesChart's marker+list UI — the
            same real fact is already visible per-conference via each
            BarRow's own hover detail; this just surfaces the registry
            entry explicitly too, rather than leaving it silently unused
            for this one non-generic chart kind. */}
        {exhibitAnnotations.map((a) => (
          <div className="trend-note" key={a.id} style={{ marginTop: 6 }}>{a.label}</div>
        ))}
      </div>
    );
  }

  // A real, recurring distribution-stats shape (FIG512/513 — see
  // toDistributionStats's own note) gets a real box-and-whisker per row
  // instead of the generic ranked-bar fallback, which used to rank by
  // whichever real-numeric column came last (kurtosis) and discard the
  // other 8. Detected structurally, checked before the generic fallback
  // below so it wins whenever the real shape matches.
  const dist = toDistributionStats(exhibit);
  if (dist) {
    const domainMax = Math.max(1, ...dist.rows.map((r) => r.max));
    return (
      <div>
        {dist.rows.map((r) => (
          <BoxPlotRow key={r.label} stats={r} domainMax={domainMax} />
        ))}
        <div className="trend-note" style={{ marginTop: 6 }}>
          Whisker: min–max. Bar: middle 50% (25th–75th percentile). Solid tick: median. Dot: mean — hover a row for exact values.
        </div>
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
