declare global {
  var __VA_RATE_LIMIT_STORE: Map<string, { count: number; resetAt: number }> | undefined;
}
const RATE_LIMIT_STORE: Map<string, { count: number; resetAt: number }> =
  globalThis.__VA_RATE_LIMIT_STORE ?? (globalThis.__VA_RATE_LIMIT_STORE = new Map());

export function rateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  // Periodic cleanup to prevent unbounded growth on long-lived serverless instances
  if (RATE_LIMIT_STORE.size > 5000) {
    const now2 = Date.now();
    for (const [k, v] of RATE_LIMIT_STORE.entries()) {
      if (now2 > v.resetAt) RATE_LIMIT_STORE.delete(k);
    }
  }
  const now = Date.now();
  const entry = RATE_LIMIT_STORE.get(key);

  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxRequests - entry.count };
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
