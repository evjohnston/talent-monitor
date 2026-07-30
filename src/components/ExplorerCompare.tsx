import type { Exhibit } from "../lib/types.ts";
import { ExhibitPanel } from "./ExhibitPanel.tsx";

// Compare mode's own real view (issue #18, third and final planned PR
// for this issue) — up to 4 selected indicators, each rendered as its
// own real, independent ExhibitPanel in a grid. Deliberately NOT one
// shared chart merging several different real datasets onto a common
// axis: this app's real exhibits measure genuinely different things
// (a raw headcount, a percentage, a rank), and forcing them onto one
// axis is exactly the kind of invented, misleading composite the source
// issue's own "do not create an invented composite index" rule warns
// against. Side-by-side real panels — each with its own real axis, its
// own real MethodologyDrawer — let a reader compare trends visually
// without this app fabricating a false equivalence between them.
export function ExplorerCompare({ exhibits, onClose, onRemove }: { exhibits: Exhibit[]; onClose: () => void; onRemove: (id: string) => void }) {
  return (
    <div className="explorer-compare">
      <button type="button" className="link-btn" onClick={onClose} style={{ marginBottom: 8 }}>
        ← Back to explorer
      </button>
      <p className="trend-note" style={{ marginBottom: 8 }}>
        Comparing {exhibits.length} real indicator{exhibits.length === 1 ? "" : "s"} — each is its own real chart with its
        own real axis and units; they are shown side by side, not combined onto one shared scale.
      </p>
      <div className="row3">
        {exhibits.map((exhibit) => (
          <div key={exhibit.id} style={{ position: "relative" }}>
            <ExhibitPanel exhibit={exhibit} headingLevel={2} />
            <button
              type="button"
              className="ghost-btn"
              onClick={() => onRemove(exhibit.id)}
              aria-label={`Remove ${exhibit.title} from comparison`}
              style={{ marginTop: 4 }}
            >
              Remove from comparison
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
