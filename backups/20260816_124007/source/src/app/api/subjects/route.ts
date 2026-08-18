import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const programme = (searchParams.get("programme") || "").toUpperCase();

    if (!programme) {
      return NextResponse.json({ subjects: [] });
    }

    const subjects = await prisma.subject.findMany({
      where: { programme: { name: programme } },
      select: { name: true },
      orderBy: { name: "asc" },
      distinct: ["name"],
    });

    return NextResponse.json({ subjects: subjects.map((s) => s.name) });
  } catch (error) {
    console.error("Subjects GET error:", error);
    return NextResponse.json({ subjects: [] }, { status: 500 });
  }
}
