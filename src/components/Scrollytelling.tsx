import { useEffect, useRef, type ReactNode } from "react";

export interface ScrollyStep {
  id: string;
  eyebrow?: string;
  heading: string;
  body: ReactNode;
  visual: ReactNode;
}

// A real guided-scroll sequence — sticky visual, narrative text scrolling
// past it — built entirely on native CSS `position: sticky` inside each
// section (see .scrolly-visual in index.css), not a JavaScript-driven
// scroll-position calculation. This is deliberate, not a shortcut: CSS
// sticky needs zero script to work, so the "visual pins while its own
// text scrolls past, then releases to the next section's own sticky
// visual" effect described in the redesign brief happens identically
// whether JS runs or not — there's no separate "no-JS fallback" to
// maintain for the core mechanic, because there's nothing script-only
// about it. On narrow screens, index.css disables the sticky positioning
// entirely (`position: static`) and each step's own visual renders
// inline right after its own text — the same real linear reading order a
// no-JS reader on ANY screen size gets, not a degraded second version.
//
// Each step's own real `<h2>` is a real, native landmark a keyboard/
// screen-reader user can already jump between (browser "next heading"
// navigation) — no bespoke keyboard-trap-prone widget invented for a
// need HTML already meets.
//
// The one real JavaScript enhancement layered on top: a lightweight
// IntersectionObserver that updates `?step=<id>` via replaceState as each
// step's heading crosses the viewport center — for a shareable link to a
// specific point in the sequence, same replaceState-only pattern already
// used for pinned countries and theme (no back-button history spam from
// scrolling).
export function Scrollytelling({ steps }: { steps: ScrollyStep[] }) {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (!visible) return;
        const id = visible.target.getAttribute("data-step-id");
        if (!id) return;
        const url = new URL(window.location.href);
        url.searchParams.set("step", id);
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      },
      { rootMargin: "-45% 0px -45% 0px" } // fires when a section crosses the real viewport center, not its edges
    );
    for (const el of sectionRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [steps]);

  return (
    <div className="scrolly">
      {steps.map((step, i) => (
        <section
          key={step.id}
          id={`step-${step.id}`}
          data-step-id={step.id}
          className="scrolly-section"
          ref={(el) => { sectionRefs.current[i] = el; }}
        >
          <div className="scrolly-text">
            {step.eyebrow && <div className="scrolly-eyebrow">{step.eyebrow}</div>}
            <h2>{step.heading}</h2>
            <div className="scrolly-body">{step.body}</div>
          </div>
          <div className="scrolly-visual">{step.visual}</div>
        </section>
      ))}
    </div>
  );
}
