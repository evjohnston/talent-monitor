import { useMemo } from "react";
import type { DashboardContext } from "./types.ts";
import { STAGES } from "../lib/types.ts";
import { KpiCard } from "../components/KpiCard.tsx";
import { SectionHeader } from "../components/ChartFrame.tsx";
import { Sankey } from "../components/Sankey.tsx";
import { Scrollytelling, type ScrollyStep } from "../components/Scrollytelling.tsx";
import { DegreeLevelExplorer } from "../components/DegreeLevelExplorer.tsx";
import { PipelineFunnel } from "../components/PipelineFunnel.tsx";
import { ImmigrationGates } from "../components/ImmigrationGates.tsx";
import { ResearchMetricSwitcher } from "../components/ResearchMetricSwitcher.tsx";
import { toLatestValue, numericColumns } from "../lib/exhibitData.ts";
import { twoStreamsSankey, retentionFunnelSankey } from "../lib/sankeyData.ts";
import { degreeLevelInternationalShare, fieldInternationalShareBookend, domesticPipelineFunnel, immigrationGates, researchLeadershipMetrics } from "../lib/scrollyData.ts";

// Four real headline numbers, not six — "no more than four headline
// statistics above the first scroll," per the redesign brief. The other
// two stages (graduate training, research output) aren't dropped, just
// introduced fresh in the scrollytelling sequence below and the stage
// cards at the end, rather than repeated a third time here.
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

    const workforce = byId("FIG303");
    const workforceCol = workforce ? numericColumns(workforce)[0] : null;
    const workforceVal = workforce ? toLatestValue(workforce) : null;
    const workforceSeries = workforce && workforceCol ? workforce.rows.map((r) => (typeof r[workforceCol] === "number" ? (r[workforceCol] as number) : null)) : [];

    const retention = byId("FIG602");
    const retentionCol = "10-year stay rate";
    const retentionVal = retention ? toLatestValue(retention, retentionCol) : null;
    const retentionSeries = retention ? retention.rows.map((r) => (typeof r[retentionCol] === "number" ? (r[retentionCol] as number) * 100 : null)) : [];

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
        label: "US research doctorates",
        value: degreeVal ? degreeVal.value.toLocaleString() : "—",
        numeric: degreeVal?.value,
        formatValue: (n: number) => Math.round(n).toLocaleString(),
        caption: degreeVal ? `awarded in ${degreeVal.x}` : "no data",
        sparkline: degreeSeries,
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
    ];
  }, [ctx]);
}

export function Overview({ ctx }: { ctx: DashboardContext }) {
  const kpis = useHeadlineKpis(ctx);
  const twoStreams = useMemo(() => twoStreamsSankey(ctx.exhibits), [ctx.exhibits]);
  const retentionFunnel = useMemo(() => retentionFunnelSankey(ctx.exhibits), [ctx.exhibits]);
  const degreeLevels = useMemo(() => degreeLevelInternationalShare(ctx.exhibits), [ctx.exhibits]);
  const fieldShares = useMemo(() => fieldInternationalShareBookend(ctx.exhibits), [ctx.exhibits]);
  const pipeline = useMemo(() => domesticPipelineFunnel(ctx.exhibits), [ctx.exhibits]);
  const gates = useMemo(() => immigrationGates(ctx.exhibits), [ctx.exhibits]);
  const researchMetrics = useMemo(() => researchLeadershipMetrics(ctx.exhibits), [ctx.exhibits]);

  const steps: ScrollyStep[] = [
    {
      id: "streams",
      eyebrow: "Step 1 of 6",
      heading: "Two streams feed the US STEM workforce",
      body: (
        <>
          <p>
            Domestic and international talent feed the American STEM workforce very differently at each degree
            level — international students are a small share of bachelor's degrees, roughly half of master's, and
            over a third of doctorates.
          </p>
          <p className="scrolly-caveat">Each degree level is shown as its own 100% — not weighted by real relative degree volume across levels.</p>
        </>
      ),
      visual: twoStreams.nodes.length > 0 ? (
        <div className="panel">
          <Sankey nodes={twoStreams.nodes} links={twoStreams.links} ariaLabel="Domestic and international share of STEM degrees by degree level" width={640} height={240} />
          <div className="trend-note" style={{ marginTop: 4 }}>NCES IPEDS Completions / NCSES Survey of Earned Doctorates, {twoStreams.year}.</div>
        </div>
      ) : <div className="trend-empty">No data for this exhibit.</div>,
    },
    {
      id: "degree-levels",
      eyebrow: "Step 2 of 6",
      heading: "Dependence rises after the bachelor's level",
      body: (
        <>
          <p>
            International students earn a small share of STEM bachelor's degrees but roughly half of STEM master's
            degrees and over a third of research doctorates — and that gap has widened over the past decade.
          </p>
          <p>Select a field below to see how much that dependence varies — computer science and engineering lean far more on international students than the STEM average.</p>
        </>
      ),
      visual: <div className="panel"><DegreeLevelExplorer overall={degreeLevels} fields={fieldShares} /></div>,
    },
    {
      id: "domestic-pipeline",
      eyebrow: "Step 3 of 6",
      heading: "The domestic pipeline loses students before the workforce",
      body: (
        <>
          <p>
            Of students who start a degree intending to study STEM, well under half finish with a STEM bachelor's.
            Some switch to a non-STEM major and still graduate — a real, different outcome from leaving college
            with no degree at all.
          </p>
          <p className="scrolly-caveat">Leaving STEM and leaving college are two different real outcomes, shown separately here, not collapsed into one "attrition" number.</p>
        </>
      ),
      visual: pipeline ? <div className="panel"><PipelineFunnel cohort={pipeline.cohort} stages={pipeline.stages} /></div> : <div className="trend-empty">No data for this exhibit.</div>,
    },
    {
      id: "immigration-gates",
      eyebrow: "Step 4 of 6",
      heading: "International graduates face a sequence of gates",
      body: (
        <>
          <p>
            After graduation, an international student's path to staying in the US STEM workforce runs through
            several real, separate approval gates — F-1/J-1 status, OPT, STEM OPT, H-1B, PERM labor certification,
            and finally a green card.
          </p>
          <p className="scrolly-caveat">Not every student follows this exact path, and each gate below is a real, separately-sourced fact about a different population and year — not one cohort tracked end to end.</p>
        </>
      ),
      visual: <div className="panel"><ImmigrationGates gates={gates} /></div>,
    },
    {
      id: "retention-gap",
      eyebrow: "Step 5 of 6",
      heading: "Intent to stay exceeds long-term retention",
      body: (
        <>
          <p>
            Most international PhD recipients say they intend to stay in the United States. Fewer actually do, and
            the gap widens the longer you track them — from five years out to ten.
          </p>
          <p className="scrolly-caveat">
            {retentionFunnel.intendToStay != null
              ? `${retentionFunnel.intendToStay.toFixed(0)}% intend to stay — but that's a separate, near-graduation survey, not the same tracked cohort as the observed outcomes below.`
              : "Intent and observed outcomes come from separate surveys of different, non-identical populations."}
          </p>
        </>
      ),
      visual: retentionFunnel.nodes.length > 0 ? (
        <div className="panel">
          <Sankey nodes={retentionFunnel.nodes} links={retentionFunnel.links} ariaLabel="International STEM PhD retention funnel, 5 years and 10 years after graduation" width={640} height={260} labelMargin={150} />
          <div className="trend-note" style={{ marginTop: 4 }}>NCSES Survey of Earned Doctorates, cohort tracked through {retentionFunnel.year}.</div>
        </div>
      ) : <div className="trend-empty">No data for this exhibit.</div>,
    },
    {
      id: "research-leadership",
      eyebrow: "Step 6 of 6",
      heading: "Research leadership is shifting",
      body: (
        <>
          <p>China has pulled ahead of the US on some real research measures and remains behind on others — the picture changes depending on which real measure you look at.</p>
          <p className="scrolly-caveat">One real measure at a time — publications, patents, conferences, and R&D spending don't share a unit, so they're never combined into an invented composite score.</p>
        </>
      ),
      visual: <div className="panel"><ResearchMetricSwitcher metrics={researchMetrics} /></div>,
    },
  ];

  return (
    <div className="track-enter">
      <div className="finding-headline">
        "Growing Less, Keeping Less" — the report's own title for its conclusion. The US underdevelops its own
        STEM talent at home and underretains the international talent it trains to fill the gap, and the two
        problems compound each other.
      </div>

      <div className="kpirow">
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

      <Scrollytelling steps={steps} />

      <div className="panel">
        <SectionHeader
          level={2}
          title="What's happening at each stage of the pipeline"
          takeaway={
            <>
              Six stages, six real findings — click through to a stage for the full exhibit set behind each one, or{" "}
              <a href={`${import.meta.env.BASE_URL}downloads/`}>view all the raw data this site draws on</a>.
            </>
          }
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
