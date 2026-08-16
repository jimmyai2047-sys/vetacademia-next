import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// Throttle public authentication endpoints to slow credential stuffing and
// password-reset abuse. Per-server-instance sliding window (same model as the
// route-level limiters); for distributed throttling back this with Redis/Upstash.
const AUTH_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/auth/login": { limit: 10, windowMs: 60_000 },
  "/api/auth/register": { limit: 10, windowMs: 60_000 },
  "/api/auth/forgot-password": { limit: 5, windowMs: 60_000 },
  "/api/auth/reset-password": { limit: 10, windowMs: 60_000 },
};

// Rate-limit all admin API mutations/reads to mitigate abuse of privileged
// endpoints.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const authLimit = AUTH_LIMITS[pathname];
  if (authLimit) {
    const rl = rateLimit(
      `auth:${pathname}:${clientIp(req)}`,
      authLimit.limit,
      authLimit.windowMs
    );
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  if (pathname.startsWith("/api/admin")) {
    const rl = rateLimit(`admin:${clientIp(req)}`, 120, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ],
};
