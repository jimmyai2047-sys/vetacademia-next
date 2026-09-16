import { kv } from "@vercel/kv";

declare global {
  var __VA_RATE_LIMIT_STORE: Map<string, { count: number; resetAt: number }> | undefined;
}
const RATE_LIMIT_STORE: Map<string, { count: number; resetAt: number }> =
  globalThis.__VA_RATE_LIMIT_STORE ?? (globalThis.__VA_RATE_LIMIT_STORE = new Map());

// On Vercel, rate limits must be shared across all serverless lambda instances,
// otherwise an attacker can bypass a per-instance in-memory Map by dispersing
// requests across instances. Prefer Vercel KV (Redis). Falls back to an
// in-process Map only for local dev / when KV env vars are not configured.
const USE_KV = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

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
  if (!USE_KV) return rateLimitMap(key, maxRequests, windowMs);

  try {
    // Atomic INCR + EXPIRE is the standard Redis fixed-window rate limiter.
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, Math.ceil(windowMs / 1000));
    }
    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
    };
  } catch (err) {
    // Never fail-open into an unauthenticated bypass — fall back to in-process
    // limiting (best-effort) rather than letting everything through.
    console.error("Vercel KV rate-limit error, falling back to in-memory:", err);
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