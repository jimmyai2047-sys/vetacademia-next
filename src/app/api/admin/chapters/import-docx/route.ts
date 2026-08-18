import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subjectId } = await req.json();
    if (!subjectId) {
      return NextResponse.json({ error: "subjectId required" }, { status: 400 });
    }

    await prisma.chapter.deleteMany({ where: { subjectId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete chapters error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
