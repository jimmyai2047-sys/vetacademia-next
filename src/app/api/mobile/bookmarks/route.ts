import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { listBookmarks, toggleBookmark } from "@/lib/bookmarks-service";

export async function GET(req: Request) {
  try {
    const userId = verifyToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const bookmarks = await listBookmarks({ userId });
    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("Mobile bookmarks GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = verifyToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      userId,
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
    console.error("Mobile bookmarks POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
