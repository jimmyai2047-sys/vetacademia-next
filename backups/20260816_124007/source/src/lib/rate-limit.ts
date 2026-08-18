// Lightweight in-memory sliding-window rate limiter (per server instance).
// Sufficient for basic abuse protection. For distributed/deployment-scale
// throttling, back this with Redis/Upstash.

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return {
    success: existing.count <= limit,
    limit,
    remaining,
    resetAt: existing.resetAt,
  };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Best-effort real client IP. When behind a trusted reverse proxy the
// x-forwarded-for first hop is correct; otherwise fall back to the socket
// address which cannot be spoofed by request headers.
export function requestIp(req: unknown): string {
  const r = req as {
    headers?: { get?: (k: string) => string | null };
    socket?: { remoteAddress?: string };
  };
  const socketIp = r?.socket?.remoteAddress;
  if (socketIp && socketIp !== "::1" && socketIp !== "127.0.0.1") {
    return socketIp;
  }
  const fwd = r?.headers?.get?.("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = r?.headers?.get?.("x-real-ip");
  if (real) return real;
  return socketIp || "unknown";
}
