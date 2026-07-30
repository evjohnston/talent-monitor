import { useMemo, useState } from "react";
import type { DashboardContext } from "./types.ts";
import type { Exhibit, Stage } from "../lib/types.ts";
import { STAGES } from "../lib/types.ts";
import { SectionHeader } from "../components/ChartFrame.tsx";
import { realDateRange } from "../lib/exhibitData.ts";
import { downloadCsv, downloadJson } from "../lib/csvExport.ts";
import { buildExportFilename } from "../lib/exportFilename.ts";
import { resolveRawSourceFiles } from "../lib/rawSourceFiles.ts";
import { hasChartSvg } from "../lib/chartAvailability.ts";

// Raw files are real static assets (copied at build time — a plain
// <a download> works). Processed CSV/JSON isn't a static file anywhere;
// it's generated the same client-side way MethodologyDrawer.tsx's own
// download buttons already do, reusing the exact same functions rather
// than redirecting to that exhibit's own stage page just to click the
// same button there.
function DownloadLinks({ exhibit, byId, base }: { exhibit: Exhibit; byId: Map<string, Exhibit>; base: string }) {
  const rawFiles = resolveRawSourceFiles(exhibit, byId);
  return (
    <div className="download-links">
      <a href={`${base}downloads/raw/${rawFiles[0]}`} download>Raw{rawFiles.length > 1 ? ` (${rawFiles.length} files)` : ""}</a>
      {rawFiles.slice(1).map((f) => (
        <a key={f} href={`${base}downloads/raw/${f}`} download>+</a>
      ))}
      <span className="sep">·</span>
      <button type="button" className="link-btn" onClick={() => downloadCsv(buildExportFilename(exhibit, "csv"), exhibit.rows)}>CSV</button>
      <button
        type="button"
        className="link-btn"
        onClick={() => downloadJson(buildExportFilename(exhibit, "json"), { id: exhibit.id, title: exhibit.title, source: exhibit.sourceLong, columns: exhibit.columns, rows: exhibit.rows })}
      >
        JSON
      </button>
      {hasChartSvg(exhibit) && (
        <>
          <span className="sep">·</span>
          <a href={`${base}downloads/png/${buildExportFilename(exhibit, "png")}`} download>PNG</a>
        </>
      )}
    </div>
  );
}

export function Downloads({ ctx }: { ctx: DashboardContext }) {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const base = import.meta.env.BASE_URL;
  const byId = useMemo(() => new Map(ctx.exhibits.map((e) => [e.id, e])), [ctx.exhibits]);

  const q = query.trim().toLowerCase();
  const filtered = ctx.exhibits.filter((e) => {
    if (stageFilter !== "all" && e.stage !== stageFilter) return false;
    if (q && !`${e.id} ${e.title} ${e.sourceShort}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="track-enter">
      <div className="panel">
        <SectionHeader
          level={2}
          title="Downloads"
          takeaway={
            <>
              Two real, distinct things per exhibit: the <strong>raw file(s)</strong> this site actually imported
              from, exactly as received, and the <strong>processed data</strong> this site's own charts render
              (numeric coercion, derived calculations, entity-name grouping — see the{" "}
              <a href={`${base}methodology/`}>methodology page</a> for exactly what each processing step does).
              Neither replaces the other.
            </>
          }
        />
        <div className="downloads-toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Search exhibits…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search downloads"
          />
          <div className="tab-bar">
            <button type="button" className="chip" aria-pressed={stageFilter === "all"} onClick={() => setStageFilter("all")}>
              All stages
            </button>
            {STAGES.map((s) => (
              <button key={s.id} type="button" className="chip" aria-pressed={stageFilter === s.id} onClick={() => setStageFilter(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <SectionHeader level={2} title="Combined bundles" takeaway="Build-time-generated, real ZIP files — never a client-side re-zip of what's already on the page." />
        <div className="download-links">
          <a href={`${base}downloads/zip/all.zip`} download>All stages (ZIP)</a>
          {STAGES.map((s) => (
            <a key={s.id} href={`${base}downloads/zip/${s.id}.zip`} download>{s.label} (ZIP)</a>
          ))}
          <a href={`${base}downloads/metadata.csv`} download>Metadata dictionary (CSV)</a>
        </div>
      </div>

      <div className="panel">
        <SectionHeader level={2} title="Every exhibit" takeaway={`${filtered.length} of ${ctx.exhibits.length} real exhibits.`} />
        {filtered.length === 0 ? (
          <div className="trend-empty">No exhibits match "{query}."</div>
        ) : (
          <table className="lb downloads-table">
            <thead>
              <tr>
                <th>Exhibit</th>
                <th>Stage</th>
                <th>Date range</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="org-name">{e.title}</td>
                  <td>{e.stage}</td>
                  <td className="count">{realDateRange(e) ?? "—"}</td>
                  <td><DownloadLinks exhibit={e} byId={byId} base={base} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
