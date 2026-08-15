import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const body = await req.json();
    const { score, totalMarks, answers } = body as {
      score?: number;
      totalMarks?: number;
      answers?: Record<string, number>;
    };

    const test = await prisma.mockTest.findUnique({ where: { id } });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const attempt = await prisma.mockTestAttempt.create({
      data: {
        userId: session.user.id,
        mockTestId: id,
        score: typeof score === "number" ? score : 0,
        totalMarks: typeof totalMarks === "number" ? totalMarks : test.totalMarks,
        answers: JSON.stringify(answers || {}),
        timeTaken: 0,
        completed: true,
      },
    });

    return NextResponse.json({ success: true, attempt }, { status: 201 });
  } catch (error) {
    console.error("Mock test attempt save error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
