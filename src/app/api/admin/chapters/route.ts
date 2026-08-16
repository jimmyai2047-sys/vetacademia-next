import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { processInlineImages } from "@/lib/chapter-images";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const subjectId: string | undefined = body.subjectId;
    const replace: boolean = Boolean(body.replace);
    const chapters = Array.isArray(body.chapters) ? body.chapters : [];

    if (!subjectId) {
      return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }
    if (chapters.length === 0) {
      return NextResponse.json({ error: "No chapters provided" }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    if (replace) {
      // ChapterContent cascades on delete.
      await prisma.chapter.deleteMany({ where: { subjectId } });
    }

    const created = [];
    for (let i = 0; i < chapters.length; i++) {
      const c = chapters[i] || {};
      const title = typeof c.title === "string" ? c.title.trim() : "";
      const rawContent = typeof c.content === "string" ? c.content : "";
      if (!title) continue;
      // Offload any inline base64 images (e.g. pasted from Word) to Blob.
      const optimized = await processInlineImages(rawContent);
      const createdChapter = await prisma.chapter.create({
        data: {
          subjectId,
          title,
          content: sanitizeChapterContent(optimized),
          unitNumber: typeof c.unitNumber === "number" ? c.unitNumber : i + 1,
          type: c.type === "PRACTICAL" ? "PRACTICAL" : c.type === "THEORY" ? "THEORY" : null,
        },
      });
      created.push(createdChapter.id);
    }

    return NextResponse.json({ created: created.length }, { status: 201 });
  } catch (error) {
    console.error("Chapter bulk create error:", error);
    return NextResponse.json({ error: "Failed to create chapters" }, { status: 500 });
  }
}
