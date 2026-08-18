import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { isFarmType } from "@/lib/farm-types";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const guides = await prisma.farmGuide.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(guides);
  } catch (error) {
    console.error("Farm guides list error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
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

    const guide = await prisma.farmGuide.create({
      data: {
        title: title.trim(),
        category,
        summary: summary?.trim() || null,
        content: content ? sanitizeChapterContent(content) : null,
        published: published ?? true,
        order: order ?? 0,
      },
    });
    logAudit({
      action: "farmGuide.create",
      actor: session.user.email,
      target: guide.id,
      meta: { category },
    });
    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    console.error("Farm guide create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
