import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const specialization = searchParams.get("specialization");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 200);
    const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

    const where: Record<string, unknown> = { isAvailable: true };
    if (specialization) where.specialization = specialization;

    const experts = await prisma.expert.findMany({
      where,
      take: limit,
      skip,
      include: {
        user: {
          select: { name: true, avatar: true },
        },
        _count: {
          select: { consultations: true },
        },
      },
      orderBy: { rating: "desc" },
    });

    return NextResponse.json(experts);
  } catch (error) {
    console.error("Experts API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
