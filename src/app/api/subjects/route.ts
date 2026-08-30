import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SLUG_TO_PROGRAMME_NAME } from "@/lib/programme";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = (searchParams.get("programme") || "").trim();
    if (!raw) {
      return NextResponse.json({ subjects: [] });
    }
    // Accept either a lowercase slug (mvsc, phd, bvsc, ahdp) or a full DB name.
    const name = SLUG_TO_PROGRAMME_NAME[raw.toLowerCase()] ?? raw;

    const subjects = await prisma.subject.findMany({
      where: { programme: { name: { equals: name, mode: "insensitive" } } },
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
