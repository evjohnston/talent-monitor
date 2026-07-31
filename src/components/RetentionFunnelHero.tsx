import { useMemo } from "react";
import type { Exhibit } from "../lib/types.ts";
import { Sankey } from "./Sankey.tsx";
import { SectionHeader } from "./ChartFrame.tsx";
import { retentionFunnelSankey } from "../lib/sankeyData.ts";

// Retention & Immigration's own real hero — a custom Sankey computed
// from FIG601/FIG602 directly (identical real content/markup to
// TrackRetentionImmigration.tsx's own original inline JSX), not a plain
// exhibit, so it's its own small component rather than something
// `computeTrackLayout()`'s generic `heroId` lookup can find. Mounted as
// its own always-visible `client:load` island (issue #23's per-panel
// lazy-hydration fix, see CLAUDE.md's "Chart-page performance" section)
// — no cross-highlight wiring needed, since Sankey.tsx takes no
// emphasize/onHoverCountry props at all.
export function RetentionFunnelHero({ exhibits }: { exhibits: Exhibit[] }) {
  const funnel = useMemo(() => retentionFunnelSankey(exhibits), [exhibits]);
  if (funnel.nodes.length === 0) return null;

  return (
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
}
