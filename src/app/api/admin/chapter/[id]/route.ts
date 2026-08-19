import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { processInlineImages } from "@/lib/chapter-images";
import { sanitizeChapterContent } from "@/lib/content";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (typeof body.title === "string" && body.title.trim()) {
      data.title = body.title.trim();
    }
    if (typeof body.content === "string") {
      data.content = sanitizeChapterContent(await processInlineImages(body.content));
    }
    if (typeof body.unitNumber === "number" && body.unitNumber > 0) {
      data.unitNumber = body.unitNumber;
    }
    if (body.type === "THEORY" || body.type === "PRACTICAL") {
      data.type = body.type;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.chapter.update({
      where: { id },
      data,
      select: { id: true, title: true, content: true, unitNumber: true, type: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Chapter update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
