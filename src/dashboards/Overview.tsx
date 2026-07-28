import { useMemo } from "react";
import type { DashboardContext } from "./types.ts";
import { STAGES } from "../lib/types.ts";
import { KpiCard } from "../components/KpiCard.tsx";
import { SectionHeader } from "../components/ChartFrame.tsx";
import { toLatestValue, toRankedBars } from "../lib/exhibitData.ts";

// The Overview's KPI row — six real numbers, one per stage, each read off
// that stage's own hero exhibit (same one TrackShell features full-width
// on the stage's own page) rather than a separately-computed summary
// statistic. Never a fabricated "index" number.
function useHeadlineKpis(ctx: DashboardContext) {
  return useMemo(() => {
    const byId = (id: string) => ctx.exhibits.find((e) => e.id === id);

    const foundation = byId("FIG401");
    const foundationVal = foundation ? toLatestValue(foundation, "Math") : null;

    const degree = byId("FIG101");
    const degreeVal = degree ? toLatestValue(degree) : null;

    const grad = byId("FIG207");
    const gradVal = grad ? toLatestValue(grad, "Percent of Engineering Post-docs that are international students") : null;

    const workforce = byId("FIG303");
    const workforceVal = workforce ? toLatestValue(workforce) : null;

    const retention = byId("FIG602");
    const retentionVal = retention ? toLatestValue(retention, "10-year stay rate") : null;

    const research = byId("TAB506");
    const researchTop = research ? toRankedBars(research, 1) : null;

    return [
      {
        stage: "foundation" as const,
        label: "PISA math, vs. 2012",
        value: foundationVal ? `${foundationVal.value > 0 ? "+" : ""}${foundationVal.value}` : "—",
        caption: foundationVal ? `points, ${foundationVal.x} assessment` : "no data",
      },
      {
        stage: "degree-production" as const,
        label: "U.S. research doctorates",
        value: degreeVal ? degreeVal.value.toLocaleString() : "—",
        caption: degreeVal ? `awarded in ${degreeVal.x}` : "no data",
      },
      {
        stage: "graduate-training" as const,
        label: "International engineering postdocs",
        value: gradVal ? `${gradVal.value.toFixed(0)}%` : "—",
        caption: gradVal ? `of engineering postdocs, ${gradVal.x}` : "no data",
      },
      {
        stage: "workforce-entry" as const,
        label: "H-1B, top-10 employer share",
        value: workforceVal ? `${workforceVal.value.toFixed(0)}%` : "—",
        caption: workforceVal ? `of approvals, FY${workforceVal.x}` : "no data",
      },
      {
        stage: "retention-immigration" as const,
        label: "Int'l STEM PhD 10-yr stay rate",
        value: retentionVal ? `${(retentionVal.value * 100).toFixed(0)}%` : "—",
        caption: retentionVal ? `cohort entering ${retentionVal.x}` : "no data",
      },
      {
        stage: "research-output" as const,
        label: "Top U.S. patent recipient, 2025",
        value: researchTop?.rows[0] ? researchTop.rows[0].value.toLocaleString() : "—",
        caption: researchTop?.rows[0] ? `${researchTop.rows[0].label} · utility patents` : "no data",
      },
    ];
  }, [ctx]);
}

export function Overview({ ctx }: { ctx: DashboardContext }) {
  const kpis = useHeadlineKpis(ctx);

  return (
    <div>
      <div className="kpirow kpirow-6">
        {kpis.map((k) => (
          <KpiCard key={k.stage} label={k.label} value={k.value} caption={k.caption} />
        ))}
      </div>

      <div className="panel">
        <SectionHeader
          title="What's happening at each stage of the pipeline"
          takeaway="Six stages, six real findings — click through to a stage for the full exhibit set behind each one."
        />
        {STAGES.map((s) => {
          const note = ctx.latestNote[s.id];
          const count = ctx.exhibitsByStage[s.id]?.length ?? 0;
          return (
            <div key={s.id} className="panel" style={{ marginTop: 8 }}>
              <h3>
                <span>{s.label}</span>
                <span className="drop">{count} exhibit{count === 1 ? "" : "s"}</span>
              </h3>
              {note ? (
                <p style={{ margin: "4px 0 8px" }}><strong>{note.headline}.</strong> {note.body}</p>
              ) : (
                <p className="trend-note">{s.blurb}</p>
              )}
              <button className="pill" onClick={() => ctx.navigate(s.id)}>Open {s.label} →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
