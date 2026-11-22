import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { getSignedUrl } from "@/lib/blob";
import { signBlobViewerUrl, verifyBlobViewerToken } from "@/lib/blob-token";
import { verifyToken } from "@/lib/mobileAuth";
import { validateCsrf } from "@/lib/csrf";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

function blobHostAllowed(target: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return null;
  }
  // Both the legacy Vercel Blob host (URLs already stored in the database) and
  // the R2 media host (URLs minted after the Phase 5 migration) are ours.
  const host = parsed.hostname;
  const allowed =
    host.endsWith(".blob.vercel-storage.com") ||
    host === new URL(env.R2_PUBLIC_BASE_URL).hostname;
  if (!allowed) return null;
  return parsed;
}

// Hands an external viewer (Office Online / Google Docs — which fetch URLs
// server-side without cookies or tokens) a 307 redirect to the public R2 URL.
//
// This is rule 1 in AGENTS.md: the file bytes never pass through the Next.js
// server. The old implementation buffered the whole object into memory and
// streamed it back; a redirect costs one small response instead.
//
// Auth is unchanged: the caller must EITHER hold a valid session (browser
// fetches send cookies) OR present a short-lived HMAC token (minted server-side
// by pages that already enforce their own paywall, or via POST /api/blob).
export async function GET(req: NextRequest) {
  // Generous limit: external viewers (Google/Office) fetch from shared egress
  // IPs, so per-IP throttling must not break legit concurrent viewers. The
  // HMAC token / session check below is the real protection.
  const rl = await rateLimit(`blob:${clientIp(req)}`, 300, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const parsed = blobHostAllowed(target);
  if (!parsed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  const authed =
    !!session?.user ||
    verifyBlobViewerToken(
      target,
      req.nextUrl.searchParams.get("exp"),
      req.nextUrl.searchParams.get("sig")
    );
  if (!authed) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  try {
    // Maps the stored Blob URL to the R2 media URL (pure string transform,
    // no network call) and lets the CDN serve the bytes directly.
    const mediaUrl = await getSignedUrl(target);
    // 307 (not 302) so the method and body survive the redirect.
    return NextResponse.redirect(mediaUrl, 307);
  } catch (err) {
    console.error("Blob redirect error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// Mints a short-lived tokenized viewer URL for a blob. Requires auth: either
// a mobile Bearer token (CSRF-exempt, header can't be forged cross-site) or a
// web session + valid CSRF token. Used by client components (e.g. the chapter
// PPT viewer) that cannot mint server-side.
export async function POST(req: NextRequest) {
  const rl = await rateLimit(`blob-mint:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const bearer = req.headers.get("authorization");
  if (bearer && bearer.startsWith("Bearer ")) {
    if (!verifyToken(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const url = typeof body?.url === "string" ? body.url : "";
  if (!url || !blobHostAllowed(url)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  return NextResponse.json({ url: signBlobViewerUrl(url) });
}
