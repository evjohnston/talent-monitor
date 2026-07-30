import { useMemo } from "react";
import type { TrackDashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";
import { Sankey } from "../components/Sankey.tsx";
import { SectionHeader } from "../components/ChartFrame.tsx";
import { retentionFunnelSankey } from "../lib/sankeyData.ts";

export function TrackRetentionImmigration({ ctx }: { ctx: TrackDashboardContext }) {
  const funnel = useMemo(() => retentionFunnelSankey(ctx.exhibits), [ctx.exhibits]);

  const heroContent = funnel.nodes.length > 0 && (
    <div className="panel">
      <SectionHeader
        level={2}
        title="The Retention Gap"
        takeaway={
          funnel.intendToStay != null
            ? `${funnel.intendToStay.toFixed(0)}% of international PhD recipients say they intend to stay — but that's a separate, near-graduation survey, not the same tracked cohort as the outcomes below. What's actually observed: retention decays from ${funnel.nodes[1]?.detail} to ${funnel.nodes[3]?.detail}.`
            : undefined
        }
      />
      <Sankey
        nodes={funnel.nodes}
        links={funnel.links}
        ariaLabel="International STEM PhD retention funnel, 5 years and 10 years after graduation"
        width={820}
        height={280}
        labelMargin={190}
      />
      <div className="trend-note" style={{ marginTop: 4 }}>
        NCSES Survey of Earned Doctorates, cohort tracked through {funnel.year}. Percentages of the original cohort,
        not a real headcount — the source reports rates, not absolute counts.
      </div>
    </div>
  );

  return (
    <TrackShell
      ctx={ctx}
      stage="retention-immigration"
      heroContent={heroContent || undefined}
      // FIG601 (the intent survey) and FIG602 (the observed 5yr/10yr stay
      // rates) are exactly what retentionFunnelSankey above reads to build
      // the hero — without this they'd ALSO render as their own two
      // standalone line-chart panels right below it, repeating numbers
      // the hero already shows (a real duplication, confirmed in the
      // running app before this fix).
      excludeIds={["FIG601", "FIG602"]}
      // A real editorial sequence, not a flat "row of 3" repeated to the
      // end of the exhibit list — each section is its own question this
      // stage's remaining 10 real exhibits actually answer together,
      // grounded in docs/report-crosswalk-notes.md's own read of this
      // stage's content (the FIG604/FIG605 H-1B pairing and FIG606/
      // TAB604 PERM pairing are both real, same-source-family groupings,
      // not arbitrary chunking).
      sections={[
        {
          title: "What happens right after the PhD: the work-authorization pipeline",
          ids: ["FIG603", "FIG604", "FIG605"],
        },
        {
          title: "Employer-side friction: the PERM backlog",
          ids: ["FIG606", "TAB604"],
        },
        {
          title: "Who's declining to stay, and where they go instead",
          ids: ["FIG607", "TAB601", "TAB602"],
        },
        {
          title: "Why it matters",
          ids: ["FIG608", "FIG609"],
        },
      ]}
    />
  );
}
