import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/access";

function parseOptions(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((o) => typeof o === "string");
  } catch {
    /* ignore */
  }
  return [];
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await ctx.params;
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { status: true },
    });
    if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Editorial workflow: unpublished chapters expose nothing (admins may read).
    if (chapter.status !== "PUBLISHED") {
      const access = await getAccess();
      if (!access.isAdmin) return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const mcqs = await prisma.chapterMcq.findMany({
      where: { chapterId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        question: true,
        options: true,
        marks: true,
        difficulty: true,
      },
    });
    const data = mcqs.map((m) => ({
      id: m.id,
      question: m.question,
      options: parseOptions(m.options),
      marks: m.marks,
      difficulty: m.difficulty,
    }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Chapter MCQ public list error:", error);
    return NextResponse.json({ error: "Failed to load MCQs" }, { status: 500 });
  }
}
