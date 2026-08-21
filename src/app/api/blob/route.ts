import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/blob";

export const runtime = "nodejs";

// Serves a private Vercel Blob object to external viewers (Office Online /
// Google Docs) which fetch the URL server-side and cannot use private/blob
// tokens. We fetch the (re-signed) blob server-side and stream it back with a
// public, CORS-enabled response. Only our own Blob store host is allowed.
export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return new NextResponse("Missing url", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const signed = await getSignedUrl(target);
    const upstream = await fetch(signed);
    if (!upstream.ok) {
      return new NextResponse("Upstream error", { status: 502 });
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const filename = decodeURIComponent(
      parsed.pathname.split("/").pop() || "file"
    );
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Blob proxy error:", err);
    return new NextResponse("Error", { status: 500 });
  }
}
