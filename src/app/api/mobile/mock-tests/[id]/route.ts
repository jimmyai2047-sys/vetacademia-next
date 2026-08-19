import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseOptions(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((o) => String(o));
  } catch {
    // Fallback: split by newline or comma.
    return raw
      .split(/\r?\n|,(?![^[]*\])/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const test = await prisma.mockTest.findUnique({
      where: { id },
      include: {
        subject: true,
        questions: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      );
    }

    const questions = test.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: parseOptions(q.options),
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      explanation: q.explanation,
    }));

    return NextResponse.json({
      id: test.id,
      title: test.title,
      description: test.description,
      duration: test.duration,
      totalMarks: test.totalMarks,
      subject: test.subject?.name ?? null,
      questions,
    });
  } catch (error) {
    console.error("Mobile mock test error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
