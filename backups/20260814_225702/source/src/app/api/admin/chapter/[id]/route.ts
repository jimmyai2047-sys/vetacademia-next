import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const content = typeof body.content === "string" ? body.content : "";

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const updated = await prisma.chapter.update({
      where: { id },
      data: { content },
      select: { id: true, content: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Chapter update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
