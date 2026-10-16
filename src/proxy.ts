import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isMaintenanceOn } from "@/lib/maintenance";
import { env } from "@/lib/env";

const AUTH_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  // NOTE: /api/auth/login is deprecated (410, see its route file) — web login
  // uses NextAuth [...nextauth]. Kept here so stray callers are still throttled.
  "/api/auth/login": { limit: 10, windowMs: 60_000 },
  "/api/auth/register": { limit: 10, windowMs: 60_000 },
  "/api/auth/forgot-password": { limit: 5, windowMs: 60_000 },
  "/api/auth/reset-password": { limit: 10, windowMs: 60_000 },
};

// Exact paths of statically prerendered pages (see classifier note in
// src/app/layout.tsx). They get a nonce-free CSP — keep in sync when a page
// flips between static and dynamic.
const STATIC_CSP_PATHS = new Set([
  "/",
  "/about",
  "/admission",
  "/blog",
  "/catalog",
  "/consultations/book",
  "/contact",
  "/diplomas",
  "/examinations",
  "/examinations/lsa",
  "/examinations/paravet-jobs",
  "/examinations/veterinary-officer",
  "/experts/apply",
  "/faqs",
  "/help",
  "/m",
  "/m/checkout",
  "/maintenance",
  "/privacy",
  "/refund-policy",
  "/saved",
  "/terms",
]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const authLimit = AUTH_LIMITS[pathname];
  if (authLimit) {
    const rl = await rateLimit(
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
    const rl = await rateLimit(`admin:${clientIp(req)}`, 120, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  if (
    (await isMaintenanceOn()) &&
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

  // Statically prerendered pages have no per-request nonce (Next.js only
  // auto-tags its inline scripts on dynamically rendered pages), so they get
  // a nonce-free CSP with 'unsafe-inline' scripts. Everywhere else the strict
  // per-request nonce CSP applies. Exact paths only (query strings ignored —
  // pathname never includes them).
  const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const isStaticCsp = STATIC_CSP_PATHS.has(cleanPath);

  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const isDev = env.NODE_ENV === "development";

  // script-src is locked to 'self' + the per-request nonce on dynamic pages;
  // 'unsafe-inline' is removed so injected scripts are rejected. Static pages
  // (set above) allow 'unsafe-inline' instead — they have no nonce. Razorpay's
  // checkout script is loaded via a direct <script src>, so its host is
  // allow-listed explicitly. style-src keeps 'unsafe-inline' because React
  // renders many inline style="" attributes that would otherwise be blocked.
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' ${isStaticCsp ? "'unsafe-inline'" : `'nonce-${nonce}'`} https://checkout.razorpay.com${
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
