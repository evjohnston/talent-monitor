import { useMemo } from "react";
import type { DashboardContext } from "./types.ts";
import { TrackShell } from "./TrackShell.tsx";
import { Sankey } from "../components/Sankey.tsx";
import { SectionHeader } from "../components/ChartFrame.tsx";
import { retentionFunnelSankey } from "../lib/sankeyData.ts";

export function TrackRetentionImmigration({ ctx }: { ctx: DashboardContext }) {
  const funnel = useMemo(() => retentionFunnelSankey(ctx.exhibits), [ctx.exhibits]);

  const heroContent = funnel.nodes.length > 0 && (
    <div className="panel">
      <SectionHeader
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

  return <TrackShell ctx={ctx} stage="retention-immigration" heroContent={heroContent || undefined} />;
}
