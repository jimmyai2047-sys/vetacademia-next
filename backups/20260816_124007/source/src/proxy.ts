import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// Rate-limit all admin API mutations/reads to mitigate abuse of privileged
// endpoints. State is per-server-instance (same model as the route-level
// limiters); for distributed throttling back this with Redis/Upstash.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
  matcher: ["/api/admin/:path*"],
};
