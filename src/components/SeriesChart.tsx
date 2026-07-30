import { useEffect, useMemo, useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import type { SliceTooltipProps, LineCustomSvgLayer, LineSeries } from "@nivo/line";
import { codeFromCountryName, countryColor, countryName } from "../lib/countries.ts";
import type { ChartAnnotation } from "../lib/annotations.ts";

// The redesign brief's own >6-series rule: some real exhibits have far
// more series than a line chart can show legibly at once (TAB202's 3
// parts each have 31 real country columns; FIG206 has 17). Past this
// count, default to the biggest/most-current series rather than every
// one at once — checked by hand against every real multi-series
// timeseries exhibit in the app (25 of them exceed 6 series; several,
// like TAB202, exceed it by 5x).
const MAX_SERIES_WITHOUT_PICKER = 6;

export interface Series {
  key: string; // a real country name/code resolves to that country's real color; anything else cycles the categorical palette below
  label: string;
  values: (number | null)[]; // same length/order as `x`; null = no data at that point, not zero
}

// Repurposes the continent-color tokens (index.css) as a small, restrained
// qualitative palette for series that AREN'T countries (degree levels, test
// subjects, visa categories...) — these tokens went unused once country
// color reverted to the named-actor scheme (see countries.ts), so this
// reuses an existing, deliberately-small set rather than inventing a new
// decorative palette.
const CATEGORICAL = ["var(--cont-na)", "var(--cont-as)", "var(--cont-eu)", "var(--cont-sa)", "var(--cont-af)", "var(--cont-oc)", "var(--cont-me)"];

// Exhibit CSVs store country series under their real display name ("United
// States", "South Korea"), not an ISO code — resolve that name back to a
// code so a real country series gets the same color everywhere else in
// this app uses, instead of an arbitrary categorical color that happens to
// land on it.
function resolveCountry(key: string): string | null {
  return /^[A-Z]{2}$/.test(key) ? key : codeFromCountryName(key);
}

function colorFor(key: string, index: number): string {
  const code = resolveCountry(key);
  return code ? countryColor(code) : CATEGORICAL[index % CATEGORICAL.length];
}

function labelFor(key: string, label: string): string {
  const code = resolveCountry(key);
  return code ? countryName(code) : label;
}

type Datum = { x: string; y: number | null };
type Ser = LineSeries & { id: string; data: Datum[] };

// A generic line chart for "x (usually year) -> one or more named numeric
// series" — the shape most talent_charts exhibits are already in. Built on
// @nivo/line (Phase 4's chosen "heavier" chart library — see CLAUDE.md's
// chart-library note) rather than hand-rolled SVG.
//
// `ResponsiveLine`, not the fixed-size `Line` — confirmed by hand that
// `Line` is the wrong choice here: it renders a real `<svg width height>`
// but NEVER a `viewBox`, so a CSS `width:100%` override just crops the
// fixed-pixel drawing instead of scaling it (real bug, caught visually —
// every 3-column exhibit panel overflowed into its neighbors before this
// fix). `ResponsiveLine` measures its real container via ResizeObserver,
// which sounds SSR-hostile, but `defaultWidth`/`defaultHeight` below (a
// documented react-virtualized-auto-sizer passthrough) give it a real,
// deterministic size to render during Astro's build-time SSR pass — a
// static reader sees an actually-sized chart, not a blank one, and it
// self-corrects to the real measured container size the instant JS
// hydrates. Defaults to a typical 3-column panel's width since most
// exhibits render there, not in the wider single hero slot — the hero
// briefly renders a touch small pre-hydration, a fine trade since it
// self-corrects immediately, versus every 3-column panel overflowing.
export function SeriesChart({
  x,
  series,
  formatValue = (v) => v.toLocaleString(),
  unitSuffix = "",
  emphasize,
  ariaLabel,
  onVisibleSeriesChange,
  annotations = [],
}: {
  x: (string | number)[];
  series: Series[];
  formatValue?: (v: number) => string;
  unitSuffix?: string;
  emphasize?: string[];
  // Nivo's own <svg role="img"> otherwise ships with no accessible name
  // at all (confirmed by an axe-core audit: svg-img-alt on every chart on
  // every page) — ResponsiveLine forwards this straight to its
  // SvgWrapper's aria-label, same as `role`/`isFocusable` below.
  ariaLabel?: string;
  // Reports which series keys are currently shown, so ExhibitChart.tsx
  // (which knows the real x-column name and full row shape, unlike this
  // component) can build a real "currently displayed" CSV subset for
  // MethodologyDrawer's download menu. Only meaningfully differs from
  // "every series" when the >6-series picker is actually active — most
  // exhibits never call this with anything but the full key set.
  onVisibleSeriesChange?: (keys: string[]) => void;
  // Real, report-supported chart annotations for this exhibit (src/lib/
  // annotations.ts) — optional, since most exhibits have none yet (5
  // real ones exist at introduction, not every chart). Rendered as both
  // a real Nivo marker (a decorative vertical line/label, not itself
  // focusable) AND a real, always-present list of buttons below the
  // chart — the list is the actual accessible interface; the marker is
  // a visual enhancement on top of it, never the only way to reach the
  // same information (essential annotation text must be accessible
  // without hover, and reachable by keyboard).
  annotations?: ChartAnnotation[];
}) {
  const n = x.length;
  const DEFAULT_W = 380, DEFAULT_H = 260;
  const margin = { top: 14, right: 14, bottom: 26, left: 46 };

  // `emphasize` (TrackShell's cross-highlight state) carries a real ISO
  // code from WorldMap's onHoverCountry — a series' raw key is a country
  // NAME as the CSV wrote it ("Germany"), not a code, so this resolves
  // before comparing.
  const isFaded = (key: string) => !!emphasize?.length && !emphasize.includes(resolveCountry(key) ?? key);

  // Ranked by each series' own most recent real value, not column order —
  // "biggest/most current" is a more useful default than "whichever six
  // columns happened to come first in the source CSV."
  const lastRealValue = (s: Series) => {
    for (let i = s.values.length - 1; i >= 0; i--) { if (s.values[i] != null) return s.values[i] as number; }
    return -Infinity;
  };
  const defaultVisibleKeys = useMemo(() => {
    if (series.length <= MAX_SERIES_WITHOUT_PICKER) return new Set(series.map((s) => s.key));
    return new Set(
      [...series].sort((a, b) => lastRealValue(b) - lastRealValue(a)).slice(0, MAX_SERIES_WITHOUT_PICKER).map((s) => s.key)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series]);
  // Deterministic from `series` alone (no Math.random/Date.now), so this
  // initial state is identical on the server and the first client render
  // — no hydration mismatch, and a no-JS reader sees this exact default,
  // not an empty/unfiltered chart.
  const [visibleKeys, setVisibleKeys] = useState(defaultVisibleKeys);
  const needsPicker = series.length > MAX_SERIES_WITHOUT_PICKER;
  const showingAll = visibleKeys.size === series.length;

  useEffect(() => {
    onVisibleSeriesChange?.([...visibleKeys]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKeys]);

  // Annotation visibility — default view shows only priority/showByDefault
  // annotations, same "don't overwhelm the default view" rule the series
  // picker already applies. `showAllAnnotations` and `selectedAnnotationId`
  // are plain local chart state, never written to the URL — see
  // annotations.ts's own comment on why (deep-linkable IDs are reserved
  // for methodology/editorial links opening a chart directly).
  const [showAllAnnotations, setShowAllAnnotations] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const visibleAnnotations = showAllAnnotations ? annotations : annotations.filter((a) => a.showByDefault);

  function toggleKey(key: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (n === 0 || series.length === 0) {
    return <div className="trend-empty">No data for this exhibit.</div>;
  }

  const visibleSeries = series.filter((s) => visibleKeys.has(s.key));
  const xLabels = x.map(String);
  const data: Ser[] = visibleSeries.map((s) => ({
    id: s.key,
    data: xLabels.map((xv, i) => ({ x: xv, y: s.values[i] })),
  }));
  const indexByKey = Object.fromEntries(series.map((s, i) => [s.key, i]));

  // Faded series swap to a flat neutral instead of a lowered opacity —
  // @nivo/line's `colors` prop returns one solid color per series (no
  // per-series opacity knob on the base line layer), so "de-emphasized"
  // is expressed as "not colored" rather than "colored but faint." Same
  // goal (make the relevant series stand out) via a different mechanism.
  const colorForSeries = (s: { id: string | number }) => {
    const key = String(s.id);
    return isFaded(key) ? "var(--line-2)" : colorFor(key, indexByKey[key] ?? 0);
  };

  const showEndpointLabels = visibleSeries.length <= MAX_SERIES_WITHOUT_PICKER;

  const endpointLabels: LineCustomSvgLayer<Ser> = ({ series: computedSeries, innerWidth }) => (
    <g>
      {computedSeries.map((s) => {
        const key = String(s.id);
        const pts = s.data.filter((d) => d.data.y != null);
        const last = pts[pts.length - 1];
        if (!last) return null;
        const atEnd = last.position.x > innerWidth - 40;
        return (
          <text
            key={key}
            x={last.position.x + (atEnd ? -6 : 6)}
            y={last.position.y - 5}
            textAnchor={atEnd ? "end" : "start"}
            fontSize={9}
            fill={colorForSeries({ id: key })}
          >
            {formatValue(last.data.y as number)}{unitSuffix}
          </text>
        );
      })}
    </g>
  );

  const sliceTooltip = ({ slice }: SliceTooltipProps<Ser>) => (
    <div className="nivo-tip">
      <div style={{ fontWeight: 600, marginBottom: 3 }}>{slice.points[0]?.data.x}</div>
      {slice.points.map((p) => {
        const key = String(p.seriesId);
        const original = series.find((s) => s.key === key);
        if (!original || p.data.y == null) return null;
        return (
          <div key={key}>
            {labelFor(key, original.label)}: {formatValue(p.data.y as number)}{unitSuffix}
          </div>
        );
      })}
    </div>
  );

  // Nivo's xScale is a "point" scale keyed by the exact string labels in
  // `xLabels` — a marker's own value has to match one of those strings
  // exactly, or Nivo silently can't place it. Guarded rather than
  // assumed: an annotation's real year not being in THIS chart's current
  // x domain (e.g. a >6-series picker viewing a narrower slice) skips
  // that marker rather than erroring.
  const markers = visibleAnnotations
    .filter((a) => xLabels.includes(String(a.start)))
    .map((a) => ({
      axis: "x" as const,
      value: String(a.start),
      lineStyle: { stroke: "var(--slate)", strokeWidth: 1, strokeDasharray: "3 3" },
      textStyle: { fill: "var(--slate)", fontSize: 9 },
      legend: a.shortLabel ?? a.label,
      legendOrientation: "vertical" as const,
    }));

  return (
    <figure style={{ margin: 0 }}>
      {visibleSeries.length === 0 ? (
        <div className="trend-empty">Every series is hidden — pick one below to show it again.</div>
      ) : (
      <div style={{ width: "100%", height: DEFAULT_H }}>
        <ResponsiveLine<Ser>
          defaultWidth={DEFAULT_W}
          defaultHeight={DEFAULT_H}
          margin={margin}
          data={data}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
          curve="monotoneX"
          colors={colorForSeries}
          lineWidth={2}
          enablePoints={true}
          pointSize={4}
          pointColor={{ from: "color" }}
          pointBorderWidth={0}
          enableGridX={false}
          enableGridY={true}
          gridYValues={5}
          theme={{
            grid: { line: { stroke: "var(--line)", strokeWidth: 1 } },
            axis: {
              ticks: { text: { fontSize: 9, fill: "var(--slate)" }, line: { stroke: "transparent" } },
            },
            crosshair: { line: { stroke: "var(--ink-2)", strokeWidth: 1, strokeDasharray: "2 2" } },
          }}
          axisLeft={{ tickValues: 5, format: (v) => `${formatValue(Number(v))}${unitSuffix}` }}
          axisBottom={{ tickValues: [xLabels[0], xLabels[n - 1]].filter((v, i, a) => a.indexOf(v) === i) }}
          enableSlices="x"
          sliceTooltip={sliceTooltip}
          enableCrosshair={true}
          crosshairType="x"
          useMesh={true}
          animate={false}
          layers={["grid", "markers", "axes", "areas", "crosshair", "lines", showEndpointLabels ? endpointLabels : "points", "points", "slices", "mesh"]}
          markers={markers}
          role="img"
          ariaLabel={ariaLabel}
        />
      </div>
      )}
      {needsPicker && (
        <div className="trend-note" style={{ marginBottom: 4 }}>
          Showing {visibleSeries.length} of {series.length} series, ranked by most recent value —{" "}
          <button type="button" className="series-picker-toggle-all" onClick={() => setVisibleKeys(showingAll ? defaultVisibleKeys : new Set(series.map((s) => s.key)))}>
            {showingAll ? `show top ${MAX_SERIES_WITHOUT_PICKER} only` : `show all ${series.length}`}
          </button>
          . Click any series below to add or remove it.
        </div>
      )}
      <figcaption className="trend-legend">
        {series.map((s, i) =>
          needsPicker ? (
            <button
              key={s.key}
              type="button"
              className="legend-item legend-item-toggle"
              aria-pressed={visibleKeys.has(s.key)}
              onClick={() => toggleKey(s.key)}
            >
              {/* Swatch always shows the series' REAL color, hidden or
                  not — most non-tracked countries already render in the
                  same muted --country-other gray as a hidden series would
                  have used, so graying the swatch itself would make "off"
                  indistinguishable from "on, but a minor country." Hidden
                  state is carried by the label's own strikethrough/opacity
                  instead, never by recoloring the swatch. */}
              <span className="swatch" style={{ background: colorFor(s.key, i) }} />
              {labelFor(s.key, s.label)}
            </button>
          ) : (
            <span key={s.key} className="legend-item">
              <span className="swatch" style={{ background: colorFor(s.key, i) }} />
              {labelFor(s.key, s.label)}
            </span>
          )
        )}
      </figcaption>
      {annotations.length > 0 && (
        <div className="chart-annotations">
          <button type="button" className="chip" aria-pressed={showAllAnnotations} onClick={() => setShowAllAnnotations((v) => !v)}>
            {showAllAnnotations ? "Fewer annotations" : `Annotations (${annotations.length})`}
          </button>
          {/* The real, always-present accessible interface — not the
              decorative chart marker above, which has no DOM focus target
              at all. A screen reader or keyboard user reaches every
              annotation's full text here regardless of hover or the
              marker's own on-chart position. */}
          <ul className="chart-annotation-list">
            {visibleAnnotations.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="chart-annotation-btn"
                  aria-expanded={selectedAnnotationId === a.id}
                  onClick={() => setSelectedAnnotationId((prev) => (prev === a.id ? null : a.id))}
                >
                  {a.start}
                  {a.end != null ? `–${a.end}` : ""}: {a.shortLabel ?? a.label}
                </button>
                {selectedAnnotationId === a.id && <div className="chart-annotation-detail">{a.detail}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </figure>
  );
}
