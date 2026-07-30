import type { ReactNode } from "react";

// The plain-language title + one-sentence takeaway pattern used above
// every real section — title states the QUESTION or subject, takeaway
// states what the current real data actually shows, so a reader gets an
// answer before they have to read the chart itself.
//
// `level` picks the real heading tag, not just a font size — every page's
// actual hierarchy is h1 (page title, BaseLayout) -> h2 (a named
// TrackShell section, or a stage's hero exhibit) -> h3 (an individual
// exhibit panel within one of those). Defaults to 3 since most callers
// are a plain exhibit panel; TrackShell/Overview pass 2 for their own
// section-level headers. Picking the wrong level here is exactly what
// axe-core's heading-order check caught (every page had ONLY h3s below
// h1, a real skipped level) — fixed at this shared component rather than
// per call site, same "general level, not one-off" rule as elsewhere.
export function SectionHeader({
  title,
  takeaway,
  note,
  level = 3,
}: {
  title: ReactNode;
  takeaway?: ReactNode;
  note?: ReactNode;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className="section-header">
      <Heading>
        <span>{title}</span>
        {note}
      </Heading>
      {takeaway && <div className="panel-takeaway">{takeaway}</div>}
    </div>
  );
}

// A single, full-width, bounded finding sentence — the ONE place per
// dashboard allowed to read as a small "hero" (the Overview leadership
// statement); everywhere else a takeaway is left-aligned prose. Never
// centered content beyond the sentence itself, and never hard-coded —
// always generated from the current real data at the call site.
export function PolicyTakeaway({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "warning" }) {
  return (
    <div className={`policy-takeaway${tone === "warning" ? " policy-takeaway-warning" : ""}`} role={tone === "warning" ? "note" : undefined}>
      {children}
    </div>
  );
}

// Collapses the long, real Sources & Method prose by default so a reader
// isn't asked to read methodology before the page's own findings — the
// full text is one click away, never deleted or shortened. A native
// <details>/<summary> rather than useState-gated JSX: with JS disabled
// (the Astro migration's static-fallback requirement) a conditionally-
// rendered body would be missing from the HTML entirely, not just hidden
// — <details> puts the real text in the DOM and lets the browser handle
// open/close with zero script, same visual affordance via CSS below.
export function ExpandableMethods({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <details className="expandable-methods">
      <summary className="expandable-methods-toggle">
        {summary} <span className="expandable-methods-caret" />
      </summary>
      <div className="expandable-methods-body">{children}</div>
    </details>
  );
}
