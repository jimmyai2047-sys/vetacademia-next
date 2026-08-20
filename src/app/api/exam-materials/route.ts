import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { published: true };
    if (subject) where.subject = subject;
    if (category) where.category = category;

    const materials = await prisma.examMaterial.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error("Exam materials API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
