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
    const programme = (searchParams.get("programme") || "").toUpperCase();
    if (!programme) {
      return NextResponse.json({ subjects: [] });
    }

    const subjects = await prisma.subject.findMany({
      where: { programme: { name: programme } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // De-duplicate by name, keeping the first id encountered.
    const seen = new Set<string>();
    const result = subjects
      .filter((s) => (seen.has(s.name) ? false : (seen.add(s.name), true)))
      .map((s) => ({ id: s.id, name: s.name }));

    return NextResponse.json({ subjects: result });
  } catch (error) {
    console.error("Exam subjects GET error:", error);
    return NextResponse.json({ subjects: [] }, { status: 500 });
  }
}
