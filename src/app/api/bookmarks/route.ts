import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { listBookmarks, toggleBookmark } from "@/lib/bookmarks-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const bookmarks = await listBookmarks({ userId: session.user.id });
    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("Bookmarks GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = (await req.json().catch(() => ({}))) as {
      type?: string;
      refId?: string;
      title?: string;
      url?: string;
      note?: string;
    };
    const { type, refId, title, url, note } = body;
    if (!type || !refId || !title || !url) {
      return NextResponse.json(
        { error: "type, refId, title and url are required" },
        { status: 400 }
      );
    }
    const { bookmark, created } = await toggleBookmark({
      userId: session.user.id,
      type,
      refId,
      title,
      url,
      note,
    });
    if (!created) {
      return NextResponse.json({ bookmark });
    }
    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    console.error("Bookmarks POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
