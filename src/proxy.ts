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

export function proxy(req: NextRequest) {
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

  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const isDev = process.env.NODE_ENV === "development";

  // script-src is locked to 'self' + the per-request nonce; 'unsafe-inline'
  // is removed so injected scripts are rejected. Razorpay's checkout script is
  // loaded via a direct <script src>, so its host is allow-listed explicitly
  // (strict-dynamic would otherwise block it). style-src keeps 'unsafe-inline'
  // because React renders many inline style="" attributes that would otherwise
  // be blocked.
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://checkout.razorpay.com${
      isDev ? " 'unsafe-eval'" : ""
    }`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.blob.vercel-storage.com",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://youtube.com https://*.blob.vercel-storage.com https://docs.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
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
