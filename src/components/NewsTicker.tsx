import { useState } from "react";
import type { NewsItem } from "../lib/sources/rss.ts";
import { STAGES } from "../lib/types.ts";
import { STAGE_COLOR } from "../lib/stageColor.ts";
import { usePrefersReducedMotion } from "../lib/useReducedMotion.ts";

const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.id, s.label]));
const NUDGE_PX = 280; // one item-ish width — prev/next steps the paused track by roughly one story

function freshnessLabel(date: string): string {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 864e5);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// Real, live-fetched trade/policy press (see src/lib/newsFeeds.ts) —
// the one part of this app that IS fetched on page load rather than
// imported once from talent_charts/. Continuously scrolling by default
// (the motion is the point — a "breaking news" strip, not a static list);
// pauses on hover/focus/explicit pause, offers prev/next to nudge through
// it while paused, and degrades to a static scrollable list under
// prefers-reduced-motion.
export function NewsTicker({ items, loading }: { items: NewsItem[]; loading?: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [manualOffsetPx, setManualOffsetPx] = useState(0);

  if (loading) {
    return (
      <div className="ticker">
        <span className="ticker-label">Talent news</span>
        <div className="ticker-empty">Loading real-time coverage…</div>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="ticker">
        <span className="ticker-label">Talent news</span>
        <div className="ticker-empty">No matching stories in the last three weeks from the tracked feeds.</div>
      </div>
    );
  }

  // `focusable`/`hidden` exist for a real keyboard-trap bug caught by
  // tests/interaction.spec.ts, not a hypothetical one: while
  // `.ticker-track` is actively mid-CSS-animation, Chromium's real
  // sequential-focus-navigation silently fails to land on a
  // transform-positioned anchor and drops focus to <body> instead —
  // confirmed by hand, a keyboard user tabbing from the page's very start
  // got stuck cycling inside the ticker forever and could never reach the
  // nav, the KPIs, or a single chart panel. `tabIndex={-1}` while
  // `!paused` removes every story link from the Tab sequence entirely
  // during autoplay (Tab now skips straight over the ticker to real page
  // content); they become real tab stops again the moment a reader
  // actually pauses it (click/Enter the ⏸ control), when their position
  // is genuinely static. The second, duplicated copy of the list (`b-`
  // keys, existing purely so the CSS animation can loop seamlessly) stays
  // permanently untabbable and `aria-hidden`, since a screen reader
  // reading linearly shouldn't hear every real story twice.
  function Item({ item, dupKey, focusable = true, hidden }: { item: NewsItem; dupKey: string; focusable?: boolean; hidden?: boolean }) {
    return (
      <span className="ticker-item" key={dupKey} aria-hidden={hidden || undefined}>
        <span className="ticker-tag" style={{ background: STAGE_COLOR[item.stage] }}>{STAGE_LABEL[item.stage]}</span>
        <a className="ticker-link" href={item.link} target="_blank" rel="noreferrer" title={`via ${item.feedName}`} tabIndex={focusable ? 0 : -1}>{item.title}</a>
        <span className="ticker-sep">· {item.feedName}</span>
        <span className="ticker-sep">· {freshnessLabel(item.date)}</span>
        <span className="ticker-sep">●</span>
      </span>
    );
  }

  if (reducedMotion) {
    return (
      <div className="ticker ticker-static">
        <span className="ticker-label">Talent news</span>
        <div className="ticker-static-list" role="list">
          {items.map((item) => <div role="listitem" key={item.id}><Item item={item} dupKey={item.id} /></div>)}
        </div>
      </div>
    );
  }

  const paused = !playing || hovering || manualOffsetPx !== 0;

  return (
    <div className="ticker" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)} onFocus={() => setHovering(true)} onBlur={() => setHovering(false)}>
      <span className="ticker-label"><span className="live-dot" />Talent news</span>
      <button className="ticker-ctrl" aria-label="Previous story" onClick={() => setManualOffsetPx((p) => p + NUDGE_PX)}>‹</button>
      <div className="ticker-track-wrap">
        <div
          className={`ticker-track${paused ? " paused" : ""}`}
          style={{ animationDuration: `${Math.max(20, items.length * 4)}s`, transform: manualOffsetPx ? `translateX(${-manualOffsetPx}px)` : undefined }}
        >
          {items.map((item) => <Item key={`a-${item.id}`} item={item} dupKey={`a-${item.id}`} focusable={paused} />)}
          {items.map((item) => <Item key={`b-${item.id}`} item={item} dupKey={`b-${item.id}`} focusable={false} hidden />)}
        </div>
      </div>
      <button className="ticker-ctrl" aria-label="Next story" onClick={() => setManualOffsetPx((p) => Math.max(0, p - NUDGE_PX))}>›</button>
      <button
        className="ticker-ctrl"
        aria-pressed={playing}
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => { setManualOffsetPx(0); setPlaying((p) => !p); }}
      >
        {playing && manualOffsetPx === 0 ? "⏸" : "▶"}
      </button>
    </div>
  );
}
