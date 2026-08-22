import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function parseOptions(raw: unknown): string[] | null {
  if (Array.isArray(raw)) {
    const arr = raw.filter((o) => typeof o === "string") as string[];
    return arr.length >= 2 ? arr : null;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parseOptions(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

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
    const mcqs = await prisma.chapterMcq.findMany({
      where: { chapterId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        question: true,
        options: true,
        correctIndex: true,
        marks: true,
        explanation: true,
        difficulty: true,
        order: true,
      },
    });
    const data = mcqs.map((m) => ({
      ...m,
      options: parseOptions(m.options) ?? [],
    }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Chapter MCQ list error:", error);
    return NextResponse.json({ error: "Failed to load MCQs" }, { status: 500 });
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
    const question = (body.question as string | undefined)?.trim();
    const options = parseOptions(body.options);
    const correctIndex = body.correctIndex as number | undefined;

    if (!chapterId || !question) {
      return NextResponse.json({ error: "chapterId and question required" }, { status: 400 });
    }
    if (!options) {
      return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });
    }
    if (
      typeof correctIndex !== "number" ||
      correctIndex < 0 ||
      correctIndex >= options.length
    ) {
      return NextResponse.json({ error: "Invalid correct answer" }, { status: 400 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true },
    });
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const count = await prisma.chapterMcq.count({ where: { chapterId } });
    const created = await prisma.chapterMcq.create({
      data: {
        chapterId,
        question,
        options: JSON.stringify(options),
        correctIndex,
        marks: typeof body.marks === "number" ? body.marks : 1,
        explanation: typeof body.explanation === "string" ? body.explanation.trim() || null : null,
        difficulty: typeof body.difficulty === "number" ? body.difficulty : 2,
        order: typeof body.order === "number" ? body.order : count,
      },
    });
    return NextResponse.json({ ...created, options }, { status: 201 });
  } catch (error) {
    console.error("Chapter MCQ create error:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
