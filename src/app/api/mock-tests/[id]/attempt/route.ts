import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessMockTest } from "@/lib/access";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const answers = (body?.answers ?? {}) as Record<string, number>;
    const timeTaken =
      typeof body?.timeTaken === "number" ? Math.max(0, body.timeTaken) : 0;

    if (typeof answers !== "object" || Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
    }

    const test = await prisma.mockTest.findUnique({
      where: { id },
      include: { questions: true },
    });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Premium gating: require the user to have access to this test.
    // Admins bypass. Mirrors the page-level access check in /mock-tests/[id].
    if (session.user.role !== "ADMIN" && !(await canAccessMockTest(test))) {
      return NextResponse.json(
        { error: "This test requires a paid plan", code: "PAYMENT_REQUIRED" },
        { status: 403 }
      );
    }

    // Recompute the score server-side from the stored correct answers so the
    // client cannot tamper with the result.
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

    const attempt = await prisma.mockTestAttempt.create({
      data: {
        userId: session.user.id,
        mockTestId: id,
        score,
        totalMarks: totalMarks || test.totalMarks,
        answers: JSON.stringify(answers),
        timeTaken,
        completed: true,
      },
    });

    // Return per-question correct answers + explanations so the client player
    // only receives them at review time (after submission), not in the initial
    // payload. The authoritative score is always the server-recomputed one.
    const review = test.questions.map((q) => ({
      id: q.id,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));

    return NextResponse.json({ success: true, attempt, review }, { status: 201 });
  } catch (error) {
    console.error("Mock test attempt save error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
