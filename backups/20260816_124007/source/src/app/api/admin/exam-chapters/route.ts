import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    if (!subjectId) {
      return NextResponse.json({ chapters: [] });
    }

    const chapters = await prisma.chapter.findMany({
      where: { subjectId },
      select: { id: true, title: true, unitNumber: true },
      orderBy: { unitNumber: "asc" },
    });

    return NextResponse.json({
      chapters: chapters.map((c) => ({ id: c.id, title: c.title })),
    });
  } catch (error) {
    console.error("Exam chapters GET error:", error);
    return NextResponse.json({ chapters: [] }, { status: 500 });
  }
}
