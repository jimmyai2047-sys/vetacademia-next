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
    const items = await prisma.projectReport.findMany({
      orderBy: [{ farmType: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Project reports list error:", error);
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

    const item = await prisma.projectReport.create({
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
      action: "projectReport.create",
      actor: session.user.email,
      target: item.id,
      meta: { farmType },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Project report create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
