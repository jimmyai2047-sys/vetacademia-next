import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
      include: { programme: { select: { name: true } } },
    });
    return NextResponse.json(
      subjects.map((s) => ({
        id: s.id,
        name: s.name,
        programme: s.programme?.name ?? null,
      }))
    );
  } catch (error) {
    console.error("Subjects list error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
