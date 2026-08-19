import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const tag = searchParams.get("tag");

    const where: Record<string, unknown> = {};
    if (subjectId) where.subjectId = subjectId;
    if (tag) where.tag = tag;

    const cards = await prisma.flashcard.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Flashcards API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
