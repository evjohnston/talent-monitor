import { useState, type ReactNode } from "react";

// The plain-language title + one-sentence takeaway pattern used above
// every real section — title states the QUESTION or subject, takeaway
// states what the current real data actually shows, so a reader gets an
// answer before they have to read the chart itself.
export function SectionHeader({
  title,
  takeaway,
  note,
}: {
  title: ReactNode;
  takeaway?: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="section-header">
      <h3>
        <span>{title}</span>
        {note}
      </h3>
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
// full text is one click away, never deleted or shortened.
export function ExpandableMethods({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="expandable-methods">
      <button className="expandable-methods-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {summary} <span className="expandable-methods-caret">{open ? "▲ Close" : "▼ Open methodology"}</span>
      </button>
      {open && <div className="expandable-methods-body">{children}</div>}
    </div>
  );
}
