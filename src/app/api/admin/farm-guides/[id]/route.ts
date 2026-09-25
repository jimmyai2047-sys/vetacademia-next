import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { processInlineImages } from "@/lib/chapter-images";
import { isFarmType } from "@/lib/farm-types";
import { logAudit } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { title, category, summary, content, published, order } = body as {
      title?: string;
      category?: string;
      summary?: string;
      content?: string;
      published?: boolean;
      order?: number;
    };

    if (!title || !category || !isFarmType(category)) {
      return NextResponse.json(
        { error: "Title and a valid farm category are required" },
        { status: 400 }
      );
    }

    const guide = await prisma.farmGuide.update({
      where: { id },
      data: {
        title: title.trim(),
        category,
        summary: summary?.trim() || null,
        content: content
          ? sanitizeChapterContent(await processInlineImages(content))
          : null,
        published: published ?? true,
        order: order ?? 0,
      },
    });
    logAudit({
      action: "farmGuide.update",
      actor: session.user.email,
      target: id,
    });
    return NextResponse.json(guide);
  } catch (error) {
    console.error("Farm guide update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const { id } = await params;
    await prisma.farmGuide.delete({ where: { id } });
    logAudit({
      action: "farmGuide.delete",
      actor: session.user.email,
      target: id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Farm guide delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
