import { useEffect, useState } from "react";
import { NewsTicker } from "./NewsTicker.tsx";
import { fetchNewsRss, type NewsItem } from "../lib/sources/rss.ts";
import { resolveNewsFeeds, NEWS_CLASSIFIER } from "../lib/newsFeeds.ts";

// Still deployed under evj@stanford.edu's Cloudflare account (see
// CLAUDE.md) — proxies the 4 news feeds that don't send their own
// Access-Control-Allow-Origin header. Astro (unlike plain Vite) only
// exposes client-side env vars prefixed PUBLIC_, so this is
// PUBLIC_WORKER_URL, not the old VITE_WORKER_URL.
const WORKER_URL = import.meta.env.PUBLIC_WORKER_URL || "https://gtm-live-proxy.evjohnston.workers.dev";

// The one thing in this app that IS live: real trade/policy press, fetched
// once on page load (not on a timer — see CLAUDE.md's reasoning for why
// the old quantum/AI verticals' 3-minute auto-refresh was removed). Never
// written to a committed file. Pulled out of the old App.tsx into its own
// component so it can mount as one client:load island in BaseLayout.astro
// — everything else on the page is either server-rendered static HTML or
// its own separate island.
export function NewsTickerLoader() {
  const [newsItems, setNewsItems] = useState<NewsItem[] | null>(null);
  useEffect(() => {
    fetchNewsRss(resolveNewsFeeds(WORKER_URL), NEWS_CLASSIFIER)
      .then(setNewsItems)
      .catch(() => setNewsItems([]));
  }, []);
  return <NewsTicker items={newsItems ?? []} loading={newsItems === null} />;
}
