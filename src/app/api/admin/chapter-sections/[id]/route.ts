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

    const existing = await prisma.chapterSection.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (typeof body.title === "string" && body.title.trim()) {
      data.title = body.title.trim();
    }
    if (typeof body.content === "string") {
      data.content = sanitizeChapterContent(await processInlineImages(body.content));
    }
    if (typeof body.order === "number") {
      data.order = body.order;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.chapterSection.update({
      where: { id },
      data,
      select: { id: true, title: true, content: true, order: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Chapter section update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const existing = await prisma.chapterSection.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    await prisma.chapterSection.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Chapter section delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
