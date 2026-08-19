import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const AUTH_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/auth/login": { limit: 10, windowMs: 60_000 },
  "/api/auth/register": { limit: 10, windowMs: 60_000 },
  "/api/auth/forgot-password": { limit: 5, windowMs: 60_000 },
  "/api/auth/reset-password": { limit: 10, windowMs: 60_000 },
};

let maintenanceMode = false;
let maintenanceCheckedAt = 0;
const MAINTENANCE_CHECK_INTERVAL = 30_000;

export function setMaintenanceMode(value: boolean) {
  maintenanceMode = value;
  maintenanceCheckedAt = Date.now();
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const authLimit = AUTH_LIMITS[pathname];
  if (authLimit) {
    const rl = rateLimit(
      `auth:${pathname}:${clientIp(req)}`,
      authLimit.limit,
      authLimit.windowMs
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  if (pathname.startsWith("/api/admin")) {
    const rl = rateLimit(`admin:${clientIp(req)}`, 120, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  if (
    maintenanceMode &&
    !pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/favicon") &&
    pathname !== "/maintenance"
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.rewrite(url);
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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
