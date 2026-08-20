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
    const score = Number(body.score) || 0;
    const totalMarks = Number(body.totalMarks) || 0;
    const timeTaken = Number(body.timeTaken) || 0;
    const answers =
      typeof body.answers === "string"
        ? body.answers
        : JSON.stringify(body.answers ?? {});

    if (!mockTestId) {
      return NextResponse.json(
        { error: "mockTestId is required" },
        { status: 400 }
      );
    }

    const attempt = await prisma.mockTestAttempt.create({
      data: {
        userId,
        mockTestId,
        score,
        totalMarks,
        timeTaken,
        answers,
        completed: true,
      },
    });

    return NextResponse.json(attempt, { status: 201 });
  } catch (error) {
    console.error("Mock attempt API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
