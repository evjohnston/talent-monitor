// Real, hand-verified trade/policy press feeds for the live news ticker —
// checked by curl for valid RSS 2.0 and Access-Control-Allow-Origin before
// being added (same bar CLAUDE.md's old quantum/AI verticals held). Two
// send open CORS and get fetched directly from the browser; the other four
// don't, and go through the Worker's /news proxy route (worker/src/index.ts).
import type { RssFeedConfig, NewsClassifierConfig } from "./sources/rss.ts";

export const NEWS_FEEDS: RssFeedConfig[] = [
  { url: "https://www.highereddive.com/feeds/news/", name: "Higher Ed Dive", corsOpen: true },
  { url: "https://thepienews.com/feed/", name: "The PIE News", corsOpen: true },
  { url: "https://www.insidehighered.com/rss.xml", name: "Inside Higher Ed", corsOpen: false },
  { url: "https://monitor.icef.com/feed/", name: "ICEF Monitor", corsOpen: false },
  { url: "https://immigrationimpact.com/feed/", name: "Immigration Impact", corsOpen: false },
  { url: "https://www.nature.com/subjects/scientific-community-and-society.rss", name: "Nature", corsOpen: false },
];

// Rewrites a no-CORS feed's URL to go through the Worker's /news proxy
// (worker/src/index.ts) instead of being fetched directly, which the
// browser would just block. Open-CORS feeds pass through untouched.
export function resolveNewsFeeds(workerUrl: string): RssFeedConfig[] {
  return NEWS_FEEDS.map((feed) =>
    feed.corsOpen ? feed : { ...feed, url: `${workerUrl}/news?url=${encodeURIComponent(feed.url)}` }
  );
}

// Tuned against a real first fetch (see CLAUDE.md's "How to extend" —
// if you loosen a pattern, re-run and read the actual items it produces
// before trusting it). `exclude` catches the same personnel/podcast/
// webinar noise every trade-press feed carries regardless of topic.
export const NEWS_CLASSIFIER: NewsClassifierConfig = {
  relevant:
    /\b(STEM|science|engineering|math(?:ematics)?|doctorate|Ph\.?D|postdoc|university|college|higher\s+ed|international\s+student|visa|immigra(?:nt|tion)|H-1B|research(?:er)?|patent|R&D|workforce)\b/i,
  exclude:
    /\b(joins|appoints?|appointment|hires?|welcomes\s+\S+\s+as|names?\s+\S+\s+as|who.s\s+news|podcast|webinar|\bepisode\b|profile|interview|op-ed|obituary|sponsored|advertisement|job\s+(?:fair|posting)|hiring\s+(?:now|event))\b/i,
  stages: {
    foundation: /\b(K-12|elementary\s+school|secondary\s+school|PISA|standardized\s+test|achievement\s+gap|school\s+(?:funding|spending|district)|study\s+abroad)\b/i,
    "degree-production": /\b(degree\s+completion|bachelor.s\s+degree|graduation\s+rate|STEM\s+degree|degree\s+production|associate.s\s+degree)\b/i,
    "graduate-training": /\b(graduate\s+school|graduate\s+program|doctoral\s+program|Ph\.?D\s+program|postdoc(?:toral)?|graduate\s+enrollment|international\s+student\s+enrollment|international\s+scholars?)\b/i,
    "workforce-entry": /\b(STEM\s+workforce|tech\s+(?:workforce|jobs|hiring)|labor\s+market|hiring\s+(?:trend|surge)|founder|startup)\b/i,
    "retention-immigration": /\b(visa|green\s+card|\bOPT\b|H-1B\s+(?:lottery|cap|denial|registration)|immigration\s+polic|deportation|\bICE\b|USCIS|SEVP|F-1\s+visa|PERM|work\s+authorization)\b/i,
    "research-output": /\b(research\s+funding|R&D\s+spending|patent|citation|Nobel|NSF\s+budget|scientific\s+research|research\s+competitiveness|research\s+output)\b/i,
  },
};
