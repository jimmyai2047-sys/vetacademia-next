import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const difficulty = searchParams.get("difficulty");

    const where: Record<string, unknown> = {};
    if (subjectId) where.subjectId = subjectId;

    const mockTests = await prisma.mockTest.findMany({
      where,
      include: {
        subject: true,
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const filtered = difficulty
      ? mockTests.filter((t) => t.title.toLowerCase().includes(difficulty.toLowerCase()))
      : mockTests;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Mock tests API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { mockTestId, answers, timeTaken } = await req.json();

    const mockTest = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: { questions: true },
    });

    if (!mockTest) {
      return NextResponse.json({ error: "Mock test not found" }, { status: 404 });
    }

    let score = 0;
    const questionResults: Record<string, { correct: boolean; selected: number }> = {};

    for (const question of mockTest.questions) {
      const selected = answers[question.id];
      const isCorrect = selected === question.correctAnswer;
      if (isCorrect) score += question.marks;
      questionResults[question.id] = { correct: isCorrect, selected };
    }

    return NextResponse.json({
      score,
      totalMarks: mockTest.totalMarks,
      percentage: Math.round((score / mockTest.totalMarks) * 100),
      results: questionResults,
    });
  } catch (error) {
    console.error("Mock test submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
