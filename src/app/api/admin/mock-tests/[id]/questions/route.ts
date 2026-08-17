import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const questions = await prisma.question.findMany({
      where: { mockTestId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(questions);
  } catch (error) {
    console.error("Questions list error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const {
      text,
      options,
      correctAnswer,
      marks,
      explanation,
      difficulty,
    } = body as {
      text?: string;
      options?: string[];
      correctAnswer?: number;
      marks?: number;
      explanation?: string;
      difficulty?: number;
    };

    if (!text || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: "Question text and at least 2 options required" },
        { status: 400 }
      );
    }
    if (
      typeof correctAnswer !== "number" ||
      correctAnswer < 0 ||
      correctAnswer >= options.length
    ) {
      return NextResponse.json(
        { error: "Invalid correct answer index" },
        { status: 400 }
      );
    }

    const test = await prisma.mockTest.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const question = await prisma.question.create({
      data: {
        mockTestId: id,
        text: text.trim(),
        options: JSON.stringify(options),
        correctAnswer,
        marks: marks ?? 1,
        explanation: explanation || null,
        difficulty:
          typeof difficulty === "number" && difficulty >= 1 && difficulty <= 3
            ? difficulty
            : 2,
      },
    });
    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Question create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
