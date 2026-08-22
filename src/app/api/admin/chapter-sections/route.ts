import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { processInlineImages } from "@/lib/chapter-images";
import { sanitizeChapterContent } from "@/lib/content";

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId");
    if (!chapterId) {
      return NextResponse.json({ error: "chapterId required" }, { status: 400 });
    }

    const sections = await prisma.chapterSection.findMany({
      where: { chapterId },
      orderBy: { order: "asc" },
      select: { id: true, title: true, content: true, order: true },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Chapter sections list error:", error);
    return NextResponse.json({ error: "Failed to load sections" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const chapterId = body.chapterId as string | undefined;
    const title = (body.title as string | undefined)?.trim();

    if (!chapterId || !title) {
      return NextResponse.json({ error: "chapterId and title required" }, { status: 400 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true },
    });
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const count = await prisma.chapterSection.count({ where: { chapterId } });
    const content = typeof body.content === "string" ? sanitizeChapterContent(await processInlineImages(body.content)) : "";
    const order = typeof body.order === "number" ? body.order : count;

    const section = await prisma.chapterSection.create({
      data: { chapterId, title, content, order },
      select: { id: true, title: true, content: true, order: true },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("Chapter section create error:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
