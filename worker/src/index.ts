// Global Talent Monitor — live-data proxy.
//
// Exists for exactly one reason: 4 of the 6 news-ticker feeds
// (src/lib/newsFeeds.ts) don't send an Access-Control-Allow-Origin header,
// so a direct browser fetch is silently blocked. The other 2 (open CORS)
// never touch this Worker at all — see App.tsx/newsFeeds.ts's
// resolveNewsFeeds().
//
// This is a dumb proxy, not a classifier: it fetches the real feed URL
// server-side and returns the raw RSS XML as-is, with CORS headers added.
// Classification (src/lib/sources/rss.ts's classifyStage) happens
// client-side either way, on whichever feeds it received — proxied or
// direct look identical to the code that parses them.
export interface Env {
  ALLOWED_ORIGINS: string;
}

const CACHE_SECONDS = 3600; // trade press moves at most a few times an hour; no honest reason to hit it more often

function pickOrigin(reqOrigin: string | null, allowedCsv: string): string {
  const allowed = allowedCsv.split(",").map((s) => s.trim()).filter(Boolean);
  if (reqOrigin && allowed.includes(reqOrigin)) return reqOrigin;
  return allowed[0] ?? "";
}

function withCors(res: Response, origin: string): Response {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  return new Response(res.body, { status: res.status, headers });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = pickOrigin(req.headers.get("Origin"), env.ALLOWED_ORIGINS);

    if (req.method === "OPTIONS") {
      return withCors(new Response(null, { headers: { "Access-Control-Allow-Methods": "GET, OPTIONS" } }), origin);
    }
    if (req.method !== "GET") return withCors(json({ error: "method not allowed" }, 405), origin);

    if (url.pathname === "/" || url.pathname === "/health") {
      return withCors(json({ ok: true, routes: ["/news?url=<encoded feed url>"] }), origin);
    }

    if (url.pathname === "/news") {
      const feedUrl = url.searchParams.get("url");
      if (!feedUrl) return withCors(json({ error: "missing url param" }, 400), origin);

      const cache = caches.default;
      const cacheKey = new Request(req.url, req);
      const hit = await cache.match(cacheKey);
      if (hit) return withCors(hit, origin);

      try {
        const upstream = await fetch(feedUrl, { headers: { "User-Agent": "GlobalTalentMonitor/1.0 (research dashboard)" } });
        const body = await upstream.text();
        const res = new Response(body, {
          status: upstream.status,
          headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": `public, max-age=${CACHE_SECONDS}` },
        });
        await cache.put(cacheKey, res.clone());
        return withCors(res, origin);
      } catch (err) {
        return withCors(json({ error: (err as Error).message }, 502), origin);
      }
    }

    return withCors(json({ error: "not found" }, 404), origin);
  },
} satisfies ExportedHandler<Env>;
