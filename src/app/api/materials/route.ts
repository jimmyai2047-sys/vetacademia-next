import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const type = searchParams.get("type");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 200);
    const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

    const where: Record<string, unknown> = { isPublic: true };
    if (subjectId) where.subjectId = subjectId;
    if (type) where.type = type.toUpperCase();

    const materials = await prisma.studyMaterial.findMany({
      where,
      take: limit,
      skip,
      include: {
        subject: true,
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error("Materials API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
