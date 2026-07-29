import { useMemo } from "react";
import type { DashboardContext } from "./types.ts";
import { STAGES } from "../lib/types.ts";
import { KpiCard } from "../components/KpiCard.tsx";
import { SectionHeader } from "../components/ChartFrame.tsx";
import { Sankey } from "../components/Sankey.tsx";
import { toLatestValue, toRankedBars, numericColumns } from "../lib/exhibitData.ts";
import { twoStreamsSankey } from "../lib/sankeyData.ts";

// The Overview's KPI row — six real numbers, one per stage, each read off
// that stage's own hero exhibit (same one TrackShell features full-width
// on the stage's own page) rather than a separately-computed summary
// statistic. Never a fabricated "index" number.
function useHeadlineKpis(ctx: DashboardContext) {
  return useMemo(() => {
    const byId = (id: string) => ctx.exhibits.find((e) => e.id === id);

    const foundation = byId("FIG401");
    const foundationVal = foundation ? toLatestValue(foundation, "Math") : null;
    const foundationSeries = foundation ? foundation.rows.map((r) => (typeof r.Math === "number" ? r.Math : null)) : [];

    const degree = byId("FIG101");
    const degreeVal = degree ? toLatestValue(degree) : null;
    const degreeCol = degree ? numericColumns(degree)[0] : null;
    const degreeSeries = degree && degreeCol ? degree.rows.map((r) => (typeof r[degreeCol] === "number" ? (r[degreeCol] as number) : null)) : [];

    const grad = byId("FIG207");
    const gradCol = "Percent of Engineering Post-docs that are international students";
    const gradVal = grad ? toLatestValue(grad, gradCol) : null;
    const gradSeries = grad ? grad.rows.map((r) => (typeof r[gradCol] === "number" ? (r[gradCol] as number) : null)) : [];

    const workforce = byId("FIG303");
    const workforceCol = workforce ? numericColumns(workforce)[0] : null;
    const workforceVal = workforce ? toLatestValue(workforce) : null;
    const workforceSeries = workforce && workforceCol ? workforce.rows.map((r) => (typeof r[workforceCol] === "number" ? (r[workforceCol] as number) : null)) : [];

    const retention = byId("FIG602");
    const retentionCol = "10-year stay rate";
    const retentionVal = retention ? toLatestValue(retention, retentionCol) : null;
    const retentionSeries = retention ? retention.rows.map((r) => (typeof r[retentionCol] === "number" ? (r[retentionCol] as number) * 100 : null)) : [];

    const research = byId("TAB506");
    const researchTop = research ? toRankedBars(research, 1) : null;
    const researchSeries = research && researchTop?.rows[0]
      ? research.rows.filter((r) => r.Company === researchTop.rows[0].label).flatMap((r) =>
          ["2005 Patents", "2015 Patents", "2025 Patents"].map((c) => (typeof r[c] === "number" ? (r[c] as number) : null))
        )
      : [];

    return [
      {
        stage: "foundation" as const,
        label: "PISA math, vs. 2012",
        value: foundationVal ? `${foundationVal.value > 0 ? "+" : ""}${foundationVal.value}` : "—",
        numeric: foundationVal?.value,
        formatValue: (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(0)}`,
        caption: foundationVal ? `points, ${foundationVal.x} assessment` : "no data",
        sparkline: foundationSeries,
      },
      {
        stage: "degree-production" as const,
        label: "U.S. research doctorates",
        value: degreeVal ? degreeVal.value.toLocaleString() : "—",
        numeric: degreeVal?.value,
        formatValue: (n: number) => Math.round(n).toLocaleString(),
        caption: degreeVal ? `awarded in ${degreeVal.x}` : "no data",
        sparkline: degreeSeries,
      },
      {
        stage: "graduate-training" as const,
        label: "International engineering postdocs",
        value: gradVal ? `${gradVal.value.toFixed(0)}%` : "—",
        numeric: gradVal?.value,
        formatValue: (n: number) => `${n.toFixed(0)}%`,
        caption: gradVal ? `of engineering postdocs, ${gradVal.x}` : "no data",
        sparkline: gradSeries,
      },
      {
        stage: "workforce-entry" as const,
        label: "H-1B, top-10 employer share",
        value: workforceVal ? `${workforceVal.value.toFixed(0)}%` : "—",
        numeric: workforceVal?.value,
        formatValue: (n: number) => `${n.toFixed(0)}%`,
        caption: workforceVal ? `of approvals, FY${workforceVal.x}` : "no data",
        sparkline: workforceSeries,
      },
      {
        stage: "retention-immigration" as const,
        label: "Int'l STEM PhD 10-yr stay rate",
        value: retentionVal ? `${(retentionVal.value * 100).toFixed(0)}%` : "—",
        numeric: retentionVal ? retentionVal.value * 100 : undefined,
        formatValue: (n: number) => `${n.toFixed(0)}%`,
        caption: retentionVal ? `cohort entering ${retentionVal.x}` : "no data",
        sparkline: retentionSeries,
      },
      {
        stage: "research-output" as const,
        label: "Top U.S. patent recipient, 2025",
        value: researchTop?.rows[0] ? researchTop.rows[0].value.toLocaleString() : "—",
        numeric: researchTop?.rows[0]?.value,
        formatValue: (n: number) => Math.round(n).toLocaleString(),
        caption: researchTop?.rows[0] ? `${researchTop.rows[0].label} · utility patents` : "no data",
        sparkline: researchSeries,
      },
    ];
  }, [ctx]);
}

export function Overview({ ctx }: { ctx: DashboardContext }) {
  const kpis = useHeadlineKpis(ctx);
  const twoStreams = useMemo(() => twoStreamsSankey(ctx.exhibits), [ctx.exhibits]);

  return (
    <div className="track-enter">
      <div className="finding-headline">
        "Growing Less, Keeping Less" — the report's own title for its conclusion. The U.S. underdevelops its own
        STEM talent at home and underretains the international talent it trains to fill the gap, and the two
        problems compound each other.
      </div>

      <div className="kpirow kpirow-6">
        {kpis.map((k) => (
          <KpiCard
            key={k.stage}
            label={k.label}
            value={k.value}
            numeric={k.numeric}
            formatValue={k.formatValue}
            caption={k.caption}
            sparkline={k.sparkline}
          />
        ))}
      </div>

      {twoStreams.nodes.length > 0 && (
        <div className="panel">
          <SectionHeader
            level={2}
            title="Two Streams of Talent"
            takeaway="Domestic and international talent feed the American STEM workforce very differently at each degree level — international students are a small share of bachelor's degrees, roughly half of master's, and over a third of doctorates."
          />
          <Sankey
            nodes={twoStreams.nodes}
            links={twoStreams.links}
            ariaLabel="Domestic and international share of STEM degrees by degree level"
            width={760}
            height={260}
          />
          <div className="trend-note" style={{ marginTop: 4 }}>
            NCES IPEDS Completions / NCSES Survey of Earned Doctorates, {twoStreams.year}. Each degree level shown as
            its own 100% — not weighted by real relative degree volume across levels.
          </div>
        </div>
      )}

      <div className="panel">
        <SectionHeader
          level={2}
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
              <a className="pill" href={`${import.meta.env.BASE_URL}${s.id}/`}>Open {s.label} →</a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
