// Server-only request guards shared by API routes that spend real money/credits.
// Cheap, layered, best-effort defenses that degrade gracefully on serverless.

/** Block cross-site callers. Same-origin browser requests always pass. */
export function isSameOrigin(req: Request): boolean {
  const host = req.headers.get("host");
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source) return true; // no browser origin (e.g. server-side); rely on rate limit
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

type Hit = number[]; // timestamps (ms)

interface RateLimitConfig {
  /** Max hits per IP in a rolling 60s window. */
  perIpPerMin: number;
  /** Max hits per IP in a rolling 10min window. */
  perIpPer10Min: number;
  /** Per-instance backstop across all callers, rolling 1h window. */
  globalPerHour: number;
}

function prune(hits: Hit, windowMs: number, now: number): Hit {
  const cutoff = now - windowMs;
  let i = 0;
  while (i < hits.length && hits[i] < cutoff) i++;
  return i > 0 ? hits.slice(i) : hits;
}

/**
 * Returns a `isRateLimited(req)` function with its own private counters. Each
 * route gets an isolated limiter so their budgets don't interfere.
 */
export function makeRateLimiter(config: RateLimitConfig) {
  const ipHits = new Map<string, Hit>();
  const globalHits: Hit = [];

  return function isRateLimited(req: Request): boolean {
    const now = Date.now();

    const prunedGlobal = prune(globalHits, 3_600_000, now);
    globalHits.length = 0;
    globalHits.push(...prunedGlobal);
    if (globalHits.length >= config.globalPerHour) return true;

    const ip = clientIp(req);
    const hits = prune(ipHits.get(ip) ?? [], 600_000, now);
    const lastMin = hits.filter((t) => t > now - 60_000).length;
    if (lastMin >= config.perIpPerMin) {
      ipHits.set(ip, hits);
      return true;
    }
    if (hits.length >= config.perIpPer10Min) {
      ipHits.set(ip, hits);
      return true;
    }

    hits.push(now);
    ipHits.set(ip, hits);
    globalHits.push(now);
    return false;
  };
}
