import { useEffect, useRef, useState, type RefObject } from "react";
import type { Exhibit } from "../lib/types.ts";
import { downloadCsv, downloadJson } from "../lib/csvExport.ts";
import { downloadChartSvg } from "../lib/chartExport.ts";
import { realDateRange } from "../lib/exhibitData.ts";
import { buildExportFilename } from "../lib/exportFilename.ts";

// The one place every exhibit's real methodology and downloads surface —
// citation (unchanged from before this existed), plus, only where
// genuinely known: a computed date range, and — for the handful of
// exhibits this codebase has precise, confirmed knowledge of (src/lib/
// types.ts's own comment on Exhibit explains why this isn't a field
// populated for every exhibit) — how a derived number is actually
// computed, or a real comparability/data-quality note. A field with no
// real content simply doesn't render its own row, rather than showing a
// placeholder to a reader.
//
// `id={methods-<exhibit.id>}` plus a `?methods=<exhibit.id>` URL param
// (read in a mount effect, same SSR-safe pattern as the pinned-country
// state — closed on both the server render and the client's first render,
// so no hydration mismatch) gives every drawer a real, stable, shareable
// deep link that auto-opens and scrolls to the right one.
//
// `chartRef` points at ExhibitPanel's own wrapper around <ExhibitChart>,
// so the SVG download can serialize whichever real <svg> that chart kind
// actually rendered without this component needing to know which chart
// kind it is — see chartExport.ts's own note on why one implementation
// covers every chart type here.
export function MethodologyDrawer({ exhibit, chartRef }: { exhibit: Exhibit; chartRef: RefObject<HTMLDivElement | null> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDetailsElement>(null);
  const [copied, setCopied] = useState<"citation" | "link" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("methods") !== exhibit.id) return;
    setOpen(true);
    ref.current?.scrollIntoView({ block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const dateRange = realDateRange(exhibit);

  return (
    <details
      id={`methods-${exhibit.id}`}
      ref={ref}
      className="expandable-methods methodology-drawer"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="expandable-methods-toggle">
        {exhibit.sourceShort} <span className="expandable-methods-caret" />
      </summary>
      <div className="expandable-methods-body">
        <dl className="methodology-fields">
          {dateRange && (
            <>
              <dt>Date range</dt>
              <dd>{dateRange}</dd>
            </>
          )}
          {exhibit.derivedFrom && exhibit.derivedFrom.length > 0 && (
            <>
              <dt>Computed by this site</dt>
              <dd>
                Derived from {exhibit.derivedFrom.join(", ")}. {exhibit.calculationNote}
              </dd>
            </>
          )}
          {exhibit.dataNote && (
            <>
              <dt>Data note</dt>
              <dd>{exhibit.dataNote}</dd>
            </>
          )}
        </dl>
        <p>{exhibit.sourceLong}</p>
        {exhibit.sourceUrls.map((u) => (
          <div key={u}><a href={u} target="_blank" rel="noreferrer">{u}</a></div>
        ))}
        <div className="methodology-actions">
          <button type="button" className="ghost-btn" onClick={() => downloadCsv(buildExportFilename(exhibit, "csv"), exhibit.rows)}>
            Download CSV
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => downloadJson(buildExportFilename(exhibit, "json"), { id: exhibit.id, title: exhibit.title, source: exhibit.sourceLong, columns: exhibit.columns, rows: exhibit.rows })}
          >
            Download JSON
          </button>
          <button type="button" className="ghost-btn" onClick={() => downloadChartSvg(buildExportFilename(exhibit, "svg"), chartRef.current)}>
            Download SVG
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => { navigator.clipboard?.writeText(exhibit.sourceLong); setCopied("citation"); }}
          >
            {copied === "citation" ? "Copied" : "Copy citation"}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("methods", exhibit.id);
              navigator.clipboard?.writeText(url.toString());
              setCopied("link");
            }}
          >
            {copied === "link" ? "Copied" : "Copy link to this methodology"}
          </button>
        </div>
      </div>
    </details>
  );
}
