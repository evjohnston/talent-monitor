import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { ComposableMap, Geographies, Geography, useGeographies, ZoomableGroup } from "react-simple-maps";
import { geoArea, geoCentroid } from "d3-geo";
import worldLow from "world-atlas/countries-110m.json";
import { alpha2FromNumeric, countryName } from "../lib/countries.ts";
import { Tooltip } from "./Tooltip.tsx";

// Default view when no country is selected — a wide-angle look at the whole
// world, not zoomed into any one place.
const DEFAULT_VIEW: { center: [number, number]; zoom: number } = { center: [10, 20], zoom: 1 };
// Flat, uniform tone every non-selected country gets dimmed to once a
// country is active — deliberately NOT the real heat color at lower
// opacity, so every unselected country reads as "not the selection," full
// stop — real volume is still visible on hover via the tooltip.
const MUTED_RGB: [number, number, number] = [222, 224, 227];
const MUTED_RGB_DARK: [number, number, number] = [42, 45, 51];

// Hoover Red, as RGB — the choropleth scale runs from the neutral panel
// tone to this, so "more here" reads as "more of the one brand accent."
const RED_RGB: [number, number, number] = [152, 0, 46];
const RED_RGB_DARK: [number, number, number] = [200, 57, 92];
const BASE_RGB: [number, number, number] = [238, 241, 244]; // var(--panel-2)
const BASE_RGB_DARK: [number, number, number] = [32, 36, 43]; // var(--panel-2), dark

const NO_DATA = { light: "#f4f5f6", dark: "#1a1d22" }; // var(--panel) — no data, not zero-as-alarming

// `mode` matters: "count" data (works by country, founders by country) is
// real-zero-floored and often Pareto-skewed, so it's sqrt-compressed off a
// true 0 floor to keep a couple of dominant countries from washing out
// every smaller real one. "range" data (a test score, a percentage-point
// gap) has no meaningful zero floor — PISA math means all sit in ~355-575,
// so scaling from 0 crushed every real country into the same near-max
// shade (confirmed by hand: this is exactly what FIG402 looked like before
// this distinction existed). Range mode scales linearly across the data's
// own real min-max instead.
function heatColor(value: number, min: number, max: number, mode: "count" | "range", dark: boolean): string {
  const base = dark ? BASE_RGB_DARK : BASE_RGB;
  const red = dark ? RED_RGB_DARK : RED_RGB;
  const t = mode === "count" ? Math.sqrt(max > 0 ? value / max : 0) : (value - min) / (max - min || 1);
  const rgb = base.map((c0, i) => Math.round(c0 + (red[i] - c0) * Math.max(0, Math.min(1, t))));
  return `rgb(${rgb.join(",")})`;
}

interface GeoFeature { rsmKey: string; id?: string | number }

// The whole-feature spherical centroid (geoCentroid on the full MultiPolygon)
// gets pulled off the real landmass by small, far-away exclaves — confirmed
// by hand: France's whole-feature centroid lands in the Bay of Biscay,
// because Natural Earth's FR feature bundles overseas territories into the
// same MultiPolygon. Centroid of just the largest ring by area reliably
// lands on the actual country instead.
function mainlandCentroid(geo: GeoFeature & { geometry?: { type: string; coordinates: unknown } }): [number, number] {
  const geometry = geo.geometry;
  if (!geometry || geometry.type !== "MultiPolygon") return geoCentroid(geo as never);
  let best: { type: "Polygon"; coordinates: unknown } | null = null;
  let bestArea = -1;
  for (const poly of geometry.coordinates as unknown[]) {
    const candidate = { type: "Polygon" as const, coordinates: poly };
    const area = Math.abs(geoArea(candidate as never));
    if (area > bestArea) { bestArea = area; best = candidate; }
  }
  return best ? geoCentroid({ type: "Feature", geometry: best, properties: {} } as never) : geoCentroid(geo as never);
}

// Renders nothing — mounted alongside <Geographies> purely to read the same
// topojson-derived GeoJSON features via the hook react-simple-maps' own
// <Geographies> uses internally, so a real per-country centroid is
// available for the programmatic zoom below.
function CentroidCapture({ geoData, onReady }: { geoData: Record<string, unknown>; onReady: (byCode: Record<string, [number, number]>) => void }) {
  const { geographies } = useGeographies({ geography: geoData });
  useEffect(() => {
    if (geographies.length === 0) return;
    const byCode: Record<string, [number, number]> = {};
    for (const geo of geographies) {
      const code = alpha2FromNumeric(String(geo.id ?? ""));
      if (!code) continue;
      const centroid = mainlandCentroid(geo);
      if (Number.isFinite(centroid[0]) && Number.isFinite(centroid[1])) byCode[code] = centroid;
    }
    onReady(byCode);
  }, [geographies, onReady]);
  return null;
}

function MapBody({
  geoData,
  values,
  min,
  max,
  mode,
  onSelect,
  onHoverCountry,
  active,
  emphasize,
  height,
  dark,
  unit,
  autoZoom = false,
}: {
  geoData: Record<string, unknown>;
  values: Record<string, number>;
  min: number;
  max: number;
  mode: "count" | "range";
  onSelect?: (country: string) => void;
  onHoverCountry?: (code: string | null) => void;
  active?: string | null;
  emphasize?: string[];
  height: number;
  dark: boolean;
  unit: string;
  autoZoom?: boolean;
}) {
  const [zoomState, setZoomState] = useState<{ center: [number, number]; zoom: number }>(DEFAULT_VIEW);
  const [tip, setTip] = useState<{ x: number; y: number; code: string } | null>(null);
  const centroidsRef = useRef<Record<string, [number, number]>>({});

  const handleCentroids = useCallback((byCode: Record<string, [number, number]>) => {
    centroidsRef.current = byCode;
  }, []);

  useEffect(() => {
    if (!autoZoom) return;
    if (active && centroidsRef.current[active]) {
      setZoomState({ center: centroidsRef.current[active], zoom: 4 });
    } else {
      setZoomState(DEFAULT_VIEW);
    }
  }, [active, autoZoom]);

  return (
    <>
      <ComposableMap
        projection="geoEqualEarth"
        width={800}
        height={height}
        style={{ width: "100%", height: "100%", display: "block" }}
        role="img"
        aria-label="World map, shaded by real per-country value — each country is individually labeled with its real number, keyboard-navigable"
      >
        <CentroidCapture geoData={geoData} onReady={handleCentroids} />
        <ZoomableGroup
          center={zoomState.center}
          zoom={zoomState.zoom}
          minZoom={1}
          maxZoom={8}
          onMoveEnd={(pos) => setZoomState({ center: pos.coordinates, zoom: pos.zoom })}
        >
          <Geographies geography={geoData}>
            {({ geographies }: { geographies: GeoFeature[] }) =>
              geographies.map((geo) => {
                const code = alpha2FromNumeric(String(geo.id ?? ""));
                const hasValue = !!code && code in values;
                const value = hasValue ? values[code!] : 0;
                const isActive = Boolean(active) && code === active;
                const hasEmphasis = !active && !!emphasize?.length;
                const isEmphasized = hasEmphasis && !!code && emphasize!.includes(code);
                const muted = (Boolean(active) && !isActive) || (hasEmphasis && !isEmphasized);
                const fill = muted
                  ? `rgb(${(dark ? MUTED_RGB_DARK : MUTED_RGB).join(",")})`
                  : hasValue ? heatColor(value, min, max, mode, dark) : (dark ? NO_DATA.dark : NO_DATA.light);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="var(--line)"
                    strokeWidth={0.5}
                    className="map-geography"
                    tabIndex={code && onSelect ? 0 : -1}
                    role={code && onSelect ? "button" : undefined}
                    aria-label={code ? `${countryName(code)}, ${hasValue ? value.toLocaleString() : "no data"} ${unit}${onSelect ? ", press Enter to pin" : ""}` : undefined}
                    style={{
                      default: { outline: "none", transition: "fill 0.2s" },
                      hover: { outline: "none", fill: "var(--red)", cursor: code && onSelect ? "pointer" : "default" },
                      pressed: { outline: "none", fill: "var(--red)" },
                    }}
                    onMouseMove={(e: ReactMouseEvent) => { if (code) { setTip({ x: e.clientX, y: e.clientY, code }); onHoverCountry?.(code); } }}
                    onMouseLeave={() => { setTip(null); onHoverCountry?.(null); }}
                    onClick={() => code && onSelect?.(code)}
                    onKeyDown={(e: ReactKeyboardEvent) => { if (code && onSelect && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(code); } }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      {tip && (
        <Tooltip x={tip.x} y={tip.y}>
          {countryName(tip.code)} · {tip.code in values ? `${values[tip.code].toLocaleString()} ${unit}` : "no data"}
          {onSelect ? " · click to pin" : ""}
        </Tooltip>
      )}
    </>
  );
}

export function WorldMap({
  values,
  unit = "",
  mode = "count",
  onSelect,
  onHoverCountry,
  active,
  emphasize,
  dark = false,
}: {
  values: Record<string, number>;
  unit?: string;
  // "count" (real-zero-floored, often skewed — works/founders by country)
  // sqrt-compresses off a true 0 floor; "range" (a score, a rate, a gap
  // that can be negative) scales linearly across the data's own real
  // min-max instead. See heatColor's comment for why this distinction
  // exists — the wrong mode for a given exhibit reads as "every country
  // basically the same shade."
  mode?: "count" | "range";
  onSelect?: (country: string) => void;
  // Broadcasts the hovered country up — TrackShell uses this to emphasize
  // the same country in every other exhibit on the page (see `emphasize`
  // below, which is how a panel RECEIVES that broadcast).
  onHoverCountry?: (code: string | null) => void;
  active?: string | null;
  emphasize?: string[];
  dark?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hiRes, setHiRes] = useState<Record<string, unknown> | null>(null);
  // The map is a standalone full-width panel with a real, definite CSS
  // height per breakpoint — a fixed viewBox height here is deliberate, NOT
  // measured from the DOM (see git history for why a ResizeObserver
  // feedback loop is the wrong approach).
  const COMPACT_VIEWBOX_HEIGHT = 500;

  const real = Object.values(values);
  const min = real.length ? Math.min(...real) : 0;
  const max = real.length ? Math.max(...real) : 1;

  useEffect(() => {
    if (!expanded) return;
    let cancelled = false;
    import("world-atlas/countries-50m.json").then((mod) => {
      if (!cancelled) setHiRes(mod.default as unknown as Record<string, unknown>);
    });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", onKey);
    return () => { cancelled = true; window.removeEventListener("keydown", onKey); };
  }, [expanded]);

  if (expanded) {
    return (
      <div className="map-fullscreen">
        <div className="map-fullscreen-head">
          <span className="lbl">Full map</span>
          <button className="ghost-btn" onClick={() => setExpanded(false)}>✕ close (esc)</button>
        </div>
        <div className="map-fullscreen-body">
          <MapBody
            geoData={(hiRes ?? (worldLow as unknown as Record<string, unknown>))}
            values={values}
            min={min}
            max={max}
            mode={mode}
            onSelect={onSelect}
            onHoverCountry={onHoverCountry}
            active={active}
            emphasize={emphasize}
            height={820}
            dark={dark}
            unit={unit}
            autoZoom
          />
        </div>
      </div>
    );
  }

  return (
    <div className="map-wrap">
      <div className="mapbox">
        <MapBody geoData={worldLow as unknown as Record<string, unknown>} values={values} min={min} max={max} mode={mode} onSelect={onSelect} onHoverCountry={onHoverCountry} active={active} emphasize={emphasize} height={COMPACT_VIEWBOX_HEIGHT} dark={dark} unit={unit} />
        <button className="map-expand" onClick={() => setExpanded(true)} aria-label="Expand map to full page">⤢</button>
      </div>
    </div>
  );
}
