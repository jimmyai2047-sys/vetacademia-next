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
      ? mockTests.filter((t: (typeof mockTests)[number]) => t.title.toLowerCase().includes(difficulty.toLowerCase()))
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
