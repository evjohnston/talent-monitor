// Live news ticker feed — the one part of this app that IS fetched live,
// on page load, rather than imported once from talent_charts/ (see
// CLAUDE.md's "Ingestion" section — everything else here is static because
// nothing else updates faster than annual; real trade/policy press does).
// Runtime-agnostic (global fetch only) so it runs in both the browser
// (feeds with open CORS) and the Worker (feeds without).
//
// Honesty tier: stage classification here is a keyword guess against the
// headline/summary, not a verified fact — real automation, weaker
// attribution than every imported exhibit. Ambiguous or unclassifiable
// items are dropped rather than guessed into the wrong stage.
import type { Stage } from "../types.ts";

export interface RssFeedConfig {
  url: string;
  name: string;
  corsOpen: boolean; // confirmed by hand — access-control-allow-origin present
}

export interface NewsClassifierConfig {
  relevant: RegExp; // topical gate — must match before anything else runs
  exclude: RegExp; // noise (personnel moves, podcasts, webinars) — checked before any stage test
  stages: Partial<Record<Stage, RegExp>>;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  date: string; // ISO date (YYYY-MM-DD)
  description: string;
  feedName: string;
  stage: Stage;
}

function decodeEntitiesOnce(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "’").replace(/&lsquo;/g, "‘").replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”").replace(/&ndash;/g, "–").replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    // Numeric entities (decimal &#8217; and hex &#x2019;) before the &amp;
    // catch-all, since &amp; would otherwise mangle &#038; (ampersand
    // itself, decimal 38) into a double-escaped "&amp;#038;"-shaped mess.
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ") // strip any inline markup in description
    .replace(/\s+/g, " ")
    .trim();
}

// Some feeds double-escape entities (e.g. "&amp;nbsp;" for a plain space) —
// a single pass leaves a literal "&nbsp;" behind. Loops to a fixed point
// (capped at 3 passes) rather than hardcoding "twice."
function decodeEntities(s: string): string {
  let out = s;
  for (let i = 0; i < 3; i++) {
    const next = decodeEntitiesOnce(out);
    if (next === out) break;
    out = next;
  }
  return out;
}

function extractTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

interface RawItem { title: string; link: string; pubDate: string; description: string }

function parseRssItems(xml: string): RawItem[] {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  return blocks.map((block) => ({
    title: extractTag(block, "title"),
    link: extractTag(block, "link"),
    pubDate: extractTag(block, "pubDate"),
    description: extractTag(block, "description"),
  }));
}

function parseDate(pubDate: string): string {
  const d = new Date(pubDate);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

// Deliberately conservative: an item matching zero or 2+ stages is dropped
// rather than assigned to a guessed one.
function classifyStage(title: string, description: string, classifier: NewsClassifierConfig): Stage | null {
  const text = `${title} ${description}`;
  if (!classifier.relevant.test(text)) return null;
  if (classifier.exclude.test(text)) return null;
  const matches = (Object.entries(classifier.stages) as [Stage, RegExp][]).filter(([, re]) => re.test(text));
  return matches.length === 1 ? matches[0][0] : null;
}

async function fetchOneFeed(feed: RssFeedConfig, cutoffMs: number, classifier: NewsClassifierConfig): Promise<NewsItem[]> {
  const res = await fetch(feed.url, { headers: { "User-Agent": "GlobalTalentMonitor/1.0 (research dashboard)" } });
  if (!res.ok) throw new Error(`${feed.name} HTTP ${res.status}`);
  const items = parseRssItems(await res.text());
  const out: NewsItem[] = [];
  for (const item of items) {
    const date = parseDate(item.pubDate);
    if (!date || new Date(date).getTime() < cutoffMs) continue;
    const stage = classifyStage(item.title, item.description, classifier);
    if (!stage) continue;
    const idSlug = item.link.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(-70);
    out.push({
      id: `rss-${idSlug}`,
      title: item.title,
      link: item.link,
      date,
      description: item.description,
      feedName: feed.name,
      stage,
    });
  }
  return out;
}

// Fetches every configured feed; one dead/changed feed doesn't drop the
// others (same soft-fail ethos as every other source in this app).
export async function fetchNewsRss(feeds: RssFeedConfig[], classifier: NewsClassifierConfig, sinceDays = 21): Promise<NewsItem[]> {
  const cutoffMs = Date.now() - sinceDays * 864e5;
  const results = await Promise.allSettled(feeds.map((f) => fetchOneFeed(f, cutoffMs, classifier)));
  const out: NewsItem[] = [];
  for (const r of results) if (r.status === "fulfilled") out.push(...r.value);
  const byId = new Map<string, NewsItem>();
  for (const item of out) byId.set(item.id, item);
  return [...byId.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}
