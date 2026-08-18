import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const difficulty = searchParams.get("difficulty");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 200);
    const skip = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const where: Record<string, unknown> = {};
    if (subjectId) where.subjectId = subjectId;
    if (difficulty) {
      where.title = { contains: difficulty, mode: "insensitive" };
    }

    const mockTests = await prisma.mockTest.findMany({
      where,
      include: {
        subject: true,
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });

    return NextResponse.json(mockTests);
  } catch (error) {
    console.error("Mock tests API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
