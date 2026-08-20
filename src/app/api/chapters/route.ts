import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId is required" },
        { status: 400 }
      );
    }

    const chapters = await prisma.chapter.findMany({
      where: { subjectId },
      select: {
        id: true,
        title: true,
        type: true,
        unitNumber: true,
        courseCode: true,
        creditHours: true,
        content: true,
        subjectId: true,
      },
      orderBy: { unitNumber: "asc" },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error("Chapters API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
