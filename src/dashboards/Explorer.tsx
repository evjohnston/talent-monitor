import { useEffect, useMemo, useState } from "react";
import type { Exhibit } from "../lib/types.ts";
import { STAGES } from "../lib/types.ts";
import { buildMetricRegistry, searchRegistry, ALL_TOPICS, type MetricRegistryEntry } from "../lib/metricRegistry.ts";
import { readExplorerFiltersFromUrl, writeExplorerFiltersToUrl, DEFAULT_EXPLORER_FILTERS, type ExplorerFilters } from "../lib/explorerUrlState.ts";
import { Sparkline } from "../components/Sparkline.tsx";
import { ExplorerDetail } from "../components/ExplorerDetail.tsx";

const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.id, s.label]));

// A real sparkline preview only for exhibits with a genuine single trend
// line (timeseries/share-timeseries) — the same real first-numeric-column
// convention MethodologyDrawer/dataReview.ts already use for "the"
// primary series of a multi-series exhibit. Every other real ChartKind
// (ranked-bar, leaderboard-years, country-map) has no single trend to
// preview, so the catalog row simply omits one rather than fabricating a
// misleading line.
function previewValues(exhibit: Exhibit): (number | null)[] | null {
  if (exhibit.kind !== "timeseries" && exhibit.kind !== "share-timeseries") return null;
  const yearCol = exhibit.columns.find((c) => /^year$/i.test(c));
  const valueCol = exhibit.columns.find((c) => c !== yearCol && exhibit.rows.some((r) => typeof r[c] === "number"));
  if (!valueCol) return null;
  return exhibit.rows.map((r) => (typeof r[valueCol] === "number" ? (r[valueCol] as number) : null));
}

// Real related indicators — ranked by number of shared real topics (a
// same-stage, same-topic exhibit is a stronger real match than a
// same-topic-only one), capped at 5 so this stays a real "see also," not
// a second catalog. Never includes the entry itself.
function relatedFor(entry: MetricRegistryEntry, registry: MetricRegistryEntry[]): MetricRegistryEntry[] {
  return registry
    .filter((r) => r.id !== entry.id)
    .map((r) => ({ r, shared: r.topics.filter((t) => entry.topics.includes(t)).length + (r.stage === entry.stage ? 1 : 0) }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 5)
    .map((x) => x.r);
}

// This is a real, full-corpus catalog (91 items) rendered as compact
// summary rows, never all 91 full charts at once — the default view is
// searchable text + an optional small sparkline preview, not a wall of
// hydrated ResponsiveLine/WorldMap instances (see the issue's own "must
// not render every chart on initial load" rule). Selecting a result
// opens a focused detail view in the SAME route (ExplorerDetail.tsx) —
// real, shareable via `?metric=<id>`, with real browser back/forward
// support (pushState on open/close, unlike the plain filter changes
// below which use replaceState to avoid spamming history per keystroke).
export function Explorer({ exhibits }: { exhibits: Exhibit[] }) {
  const registry = useMemo(() => buildMetricRegistry(exhibits), [exhibits]);
  const exhibitById = useMemo(() => new Map(exhibits.map((e) => [e.id, e])), [exhibits]);
  const registryById = useMemo(() => new Map(registry.map((r) => [r.id, r])), [registry]);
  const base = import.meta.env.BASE_URL;

  // Starts at the real default on both server and first client render —
  // no hydration mismatch — then a mount effect reads the real URL, same
  // SSR-safe pattern pinned countries/theme already established.
  const [filters, setFilters] = useState<ExplorerFilters>(DEFAULT_EXPLORER_FILTERS);
  useEffect(() => {
    setFilters(readExplorerFiltersFromUrl());
    const onPopState = () => setFilters(readExplorerFiltersFromUrl());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilters(next: ExplorerFilters, push = false) {
    setFilters(next);
    writeExplorerFiltersToUrl(next, push);
  }

  function openDetail(id: string) {
    updateFilters({ ...filters, metric: id }, true);
  }
  function closeDetail() {
    updateFilters({ ...filters, metric: null }, true);
  }

  const filtered = useMemo(() => {
    let results = searchRegistry(registry, filters.q);
    if (filters.stage !== "all") results = results.filter((r) => r.stage === filters.stage);
    if (filters.topic !== "all") results = results.filter((r) => r.topics.includes(filters.topic));
    const sorted = [...results];
    if (filters.sort === "alphabetical") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (filters.sort === "longest-series") {
      sorted.sort((a, b) => (exhibitById.get(b.id)?.rows.length ?? 0) - (exhibitById.get(a.id)?.rows.length ?? 0));
    } else {
      sorted.sort((a, b) => a.chapter - b.chapter || a.id.localeCompare(b.id));
    }
    return sorted;
  }, [registry, filters, exhibitById]);

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.q) activeChips.push({ key: "q", label: `Search: "${filters.q}"`, clear: () => updateFilters({ ...filters, q: "" }) });
  if (filters.stage !== "all") activeChips.push({ key: "stage", label: STAGE_LABEL[filters.stage], clear: () => updateFilters({ ...filters, stage: "all" }) });
  if (filters.topic !== "all") activeChips.push({ key: "topic", label: filters.topic, clear: () => updateFilters({ ...filters, topic: "all" }) });

  // A real, currently-open detail view wins over the catalog entirely —
  // see ExplorerDetail.tsx's own note on why this is a full swap, not a
  // side panel, for this first detail-view pass.
  const detailExhibit = filters.metric ? exhibitById.get(filters.metric) : undefined;
  if (filters.metric && detailExhibit) {
    const entry = registryById.get(filters.metric);
    return (
      <div className="track-enter">
        <div className="panel">
          <ExplorerDetail
            exhibit={detailExhibit}
            related={entry ? relatedFor(entry, registry) : []}
            onClose={closeDetail}
            onOpenRelated={openDetail}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="track-enter">
      <div className="panel">
        <p className="trend-note">
          Search, filter, and open any of the {registry.length} real indicators behind this site — every chart on every
          stage page, in one place. Following the guided story instead? Each stage's own page (see the nav above) leads
          with its own analyst takeaway; this is the complete, unfiltered catalog underneath it.
        </p>

        <div className="tab-bar" style={{ marginTop: 8, marginBottom: 8 }}>
          <input
            type="search"
            className="search-input"
            placeholder="Search by title, source, or topic…"
            aria-label="Search indicators"
            value={filters.q}
            onChange={(e) => updateFilters({ ...filters, q: e.target.value })}
          />
          <select aria-label="Filter by stage" value={filters.stage} onChange={(e) => updateFilters({ ...filters, stage: e.target.value as ExplorerFilters["stage"] })}>
            <option value="all">All stages</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <select aria-label="Filter by topic" value={filters.topic} onChange={(e) => updateFilters({ ...filters, topic: e.target.value })}>
            <option value="all">All topics</option>
            {ALL_TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select aria-label="Sort" value={filters.sort} onChange={(e) => updateFilters({ ...filters, sort: e.target.value as ExplorerFilters["sort"] })}>
            <option value="report-order">Sort: report order</option>
            <option value="alphabetical">Sort: alphabetical</option>
            <option value="longest-series">Sort: longest time series</option>
          </select>
        </div>

        {activeChips.length > 0 && (
          <div className="tab-bar" style={{ marginBottom: 8 }}>
            {activeChips.map((c) => (
              <button key={c.key} type="button" className="chip" onClick={c.clear} aria-label={`Remove filter: ${c.label}`}>
                {c.label} ×
              </button>
            ))}
            <button type="button" className="ghost-btn" onClick={() => updateFilters(DEFAULT_EXPLORER_FILTERS)}>
              Clear all
            </button>
          </div>
        )}

        <div className="trend-note" style={{ marginBottom: 8 }}>{filtered.length} of {registry.length} indicators shown.</div>

        {filtered.length === 0 ? (
          <div className="trend-empty">
            No indicators match these filters.{" "}
            <button type="button" className="link-btn" onClick={() => updateFilters(DEFAULT_EXPLORER_FILTERS)}>Clear all filters</button>
          </div>
        ) : (
          <ul className="explorer-results">
            {filtered.map((entry) => {
              const exhibit = exhibitById.get(entry.id);
              const preview = exhibit ? previewValues(exhibit) : null;
              return (
                <li key={entry.id} className="explorer-result">
                  <div className="explorer-result-main">
                    <div className="explorer-result-title">{entry.title}</div>
                    <div className="trend-note">
                      {STAGE_LABEL[entry.stage]} · {entry.source}
                      {entry.dateRange ? ` · ${entry.dateRange}` : ""} · {entry.reportReference}
                      {entry.isDerived ? " · computed by this site" : ""}
                    </div>
                    <div className="tab-bar" style={{ marginTop: 4 }}>
                      {entry.topics.map((t) => (
                        <span key={t} className="pill">{t}</span>
                      ))}
                    </div>
                  </div>
                  {preview && preview.filter((v) => v != null).length >= 2 && (
                    <div className="explorer-result-preview" aria-hidden="true">
                      <Sparkline values={preview} />
                    </div>
                  )}
                  <div className="explorer-result-actions">
                    {/* A real <a href>, not a bare button — works with no
                        JS (navigates to the exhibit's own real stage page
                        and deep-links its methodology drawer, same as
                        PR 1's interim behavior) and is progressively
                        enhanced to open the in-page detail view instead
                        once JS is running, without a full navigation. */}
                    <a
                      className="pill"
                      href={`${base}${entry.stage}/?methods=${entry.id}`}
                      onClick={(e) => { e.preventDefault(); openDetail(entry.id); }}
                    >
                      Open →
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
