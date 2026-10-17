import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) return null;
  return parsed;
}

// Serves a private Vercel Blob object to external viewers (Office Online /
// Google Docs) which fetch the URL server-side and cannot use private/blob
// tokens. We fetch the (re-signed) blob server-side and stream it back with a
// public, CORS-enabled response. Only our own Blob store host is allowed.
//
// Auth: the caller must EITHER hold a valid session (browser fetches send
// cookies) OR present a short-lived HMAC token (minted server-side by pages
// that already enforce their own paywall, or via POST /api/blob). Without
// this, anyone with a leaked blob URL could stream private files forever.
export async function GET(req: NextRequest) {
  // Generous limit: external viewers (Google/Office) fetch from shared egress
  // IPs, so per-IP throttling must not break legit concurrent viewers. The
  // HMAC token / session check above is the real protection.
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
    const signed = await getSignedUrl(target);
    const upstream = await fetch(signed);
    if (!upstream.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    // Vercel Blob often returns application/octet-stream for Office files,
    // which makes external viewers (Office Online) reject them with
    // "This content is blocked". Force the correct MIME by extension.
    const ext = (parsed.pathname.split(".").pop() || "").toLowerCase();
    const MIME: Record<string, string> = {
      pdf: "application/pdf",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
    };
    const contentType = MIME[ext] || upstream.headers.get("content-type") || "application/octet-stream";
    const filename = decodeURIComponent(
      parsed.pathname.split("/").pop() || "file"
    );
    const allowedOrigins = [
      "https://vetacademia.in",
      "https://www.vetacademia.in",
      "https://view.officeapps.live.com",
      "https://docs.google.com",
    ];
    const requestOrigin = req.headers.get("origin");
    const allowOrigin =
      requestOrigin && allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : "https://vetacademia.in";

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": allowOrigin,
        "Vary": "Origin",
      },
    });
  } catch (err) {
    console.error("Blob proxy error:", err);
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
