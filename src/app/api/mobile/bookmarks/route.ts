import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const userId = verifyToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
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
    const existing = await prisma.bookmark.findFirst({
      where: { userId, type, refId },
    });
    if (existing) {
      const updated = await prisma.bookmark.update({
        where: { id: existing.id },
        data: { title, url, note: note ?? existing.note },
      });
      return NextResponse.json({ bookmark: updated });
    }
    const bookmark = await prisma.bookmark.create({
      data: { userId, type, refId, title, url, note: note ?? null },
    });
    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    console.error("Mobile bookmarks POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
