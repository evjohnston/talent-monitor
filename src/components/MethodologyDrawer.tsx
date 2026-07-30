import { useEffect, useRef, useState } from "react";
import type { Exhibit } from "../lib/types.ts";
import { downloadCsv } from "../lib/csvExport.ts";
import { realDateRange } from "../lib/exhibitData.ts";

// The one place every exhibit's real methodology surfaces — citation
// (unchanged from before this existed), plus, only where genuinely known:
// a computed date range, and — for the handful of exhibits this codebase
// has precise, confirmed knowledge of (src/lib/types.ts's own comment on
// Exhibit explains why this isn't a field populated for every exhibit) —
// how a derived number is actually computed, or a real comparability/
// data-quality note. A field with no real content simply doesn't render
// its own row, rather than showing a placeholder to a reader.
//
// `id={methods-<exhibit.id>}` plus a `?methods=<exhibit.id>` URL param
// (read in a mount effect, same SSR-safe pattern as the pinned-country
// state — closed on both the server render and the client's first render,
// so no hydration mismatch) gives every drawer a real, stable, shareable
// deep link that auto-opens and scrolls to the right one.
export function MethodologyDrawer({ exhibit }: { exhibit: Exhibit }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("methods") !== exhibit.id) return;
    setOpen(true);
    ref.current?.scrollIntoView({ block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <button type="button" className="ghost-btn download-csv-btn" onClick={() => downloadCsv(`${exhibit.id}.csv`, exhibit.rows)}>
            Download this exhibit's data (CSV)
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("methods", exhibit.id);
              navigator.clipboard?.writeText(url.toString());
            }}
          >
            Copy link to this methodology
          </button>
        </div>
      </div>
    </details>
  );
}
