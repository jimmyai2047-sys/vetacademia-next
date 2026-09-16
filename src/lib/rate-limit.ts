import { Redis } from "@upstash/redis";

declare global {
  var __VA_RATE_LIMIT_STORE: Map<string, { count: number; resetAt: number }> | undefined;
}
const RATE_LIMIT_STORE: Map<string, { count: number; resetAt: number }> =
  globalThis.__VA_RATE_LIMIT_STORE ?? (globalThis.__VA_RATE_LIMIT_STORE = new Map());

// On Vercel, rate limits must be shared across all serverless lambda instances,
// otherwise an attacker can bypass a per-instance in-memory Map by dispersing
// requests across instances. Prefer Upstash Redis (installed via the Vercel
// Marketplace — injects UPSTASH_REDIS_REST_URL/TOKEN). Falls back to an
// in-process Map only for local dev / when Redis env vars are not configured.
const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
const USE_REDIS = Boolean(REDIS_URL && REDIS_TOKEN);

const redis = USE_REDIS ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

async function rateLimitMap(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (RATE_LIMIT_STORE.size > 5000) {
    const now = Date.now();
    for (const [k, v] of RATE_LIMIT_STORE.entries()) {
      if (now > v.resetAt) RATE_LIMIT_STORE.delete(k);
    }
  }
  const now = Date.now();
  const entry = RATE_LIMIT_STORE.get(key);

  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, maxRequests - 1) };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: Math.max(0, maxRequests - entry.count) };
}

export async function rateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60_000
): Promise<{ allowed: boolean; remaining: number }> {
  if (!USE_REDIS || !redis) return rateLimitMap(key, maxRequests, windowMs);

  try {
    // Atomic INCR + EXPIRE is the standard Redis fixed-window rate limiter.
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }
    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
    };
  } catch (err) {
    // Never fail-open into an unauthenticated bypass — fall back to in-process
    // limiting (best-effort) rather than letting everything through.
    console.error("Upstash Redis rate-limit error, falling back to in-memory:", err);
    return rateLimitMap(key, maxRequests, windowMs);
  }
}

export function clientIp(req: Request | { headers: Headers }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const requestIp = clientIp;

export function adminRateLimit(ip: string, path: string) {
  return rateLimit(`admin:${ip}:${path}`, 120, 60_000);
}

export function strictRateLimit(ip: string, path: string) {
  return rateLimit(`strict:${ip}:${path}`, 10, 60_000);
}