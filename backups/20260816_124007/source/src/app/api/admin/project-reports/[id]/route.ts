import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { isFarmType } from "@/lib/farm-types";
import { logAudit } from "@/lib/audit";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const {
      title,
      farmType,
      summary,
      demoContent,
      fullContent,
      price,
      published,
      order,
    } = body as {
      title?: string;
      farmType?: string;
      summary?: string;
      demoContent?: string;
      fullContent?: string;
      price?: number;
      published?: boolean;
      order?: number;
    };

    if (!title || !farmType || !isFarmType(farmType)) {
      return NextResponse.json(
        { error: "Title and a valid farm type are required" },
        { status: 400 }
      );
    }

    const item = await prisma.projectReport.update({
      where: { id },
      data: {
        title: title.trim(),
        farmType,
        summary: summary?.trim() || null,
        demoContent: demoContent ? sanitizeChapterContent(demoContent) : null,
        fullContent: fullContent ? sanitizeChapterContent(fullContent) : null,
        price: price && price > 0 ? price : 99,
        published: published ?? true,
        order: order ?? 0,
      },
    });
    logAudit({
      action: "projectReport.update",
      actor: session.user.email,
      target: id,
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Project report update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await prisma.projectReport.delete({ where: { id } });
    logAudit({
      action: "projectReport.delete",
      actor: session.user.email,
      target: id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Project report delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
