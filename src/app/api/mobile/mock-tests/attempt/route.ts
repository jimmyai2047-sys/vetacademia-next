import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/mobileAuth";

export async function POST(req: Request) {
  try {
    const userId = verifyToken(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const mockTestId = typeof body.mockTestId === "string" ? body.mockTestId : "";
    const timeTaken = Number(body.timeTaken) || 0;
    let rawAnswers: unknown = body.answers;
    if (typeof rawAnswers === "string") {
      try {
        rawAnswers = JSON.parse(rawAnswers);
      } catch {
        rawAnswers = {};
      }
    }
    const answers =
      rawAnswers && typeof rawAnswers === "object" && !Array.isArray(rawAnswers)
        ? (rawAnswers as Record<string, number>)
        : ({} as Record<string, number>);

    if (!mockTestId) {
      return NextResponse.json(
        { error: "mockTestId is required" },
        { status: 400 }
      );
    }

    const test = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: { questions: true },
    });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Recompute the score server-side from stored correct answers so the
    // client cannot tamper with the result (mirrors web attempt route).
    let score = 0;
    let totalMarks = 0;
    for (const q of test.questions) {
      const marks = typeof q.marks === "number" ? q.marks : 1;
      totalMarks += marks;
      const chosen = answers[q.id];
      if (typeof chosen === "number" && chosen === q.correctAnswer) {
        score += marks;
      }
    }
    if (!totalMarks) totalMarks = test.totalMarks;

    const attempt = await prisma.mockTestAttempt.create({
      data: {
        userId,
        mockTestId,
        score,
        totalMarks,
        timeTaken,
        answers: JSON.stringify(answers),
        completed: true,
      },
    });

    return NextResponse.json(attempt, { status: 201 });
  } catch (error) {
    console.error("Mock attempt API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
