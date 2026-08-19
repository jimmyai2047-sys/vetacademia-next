const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
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
