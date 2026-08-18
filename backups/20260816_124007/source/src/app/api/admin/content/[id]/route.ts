import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;

    const content = await prisma.chapterContent.findUnique({
      where: { id },
      select: { id: true, url: true },
    });
    if (!content) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Remove from blob storage
    try {
      await del(content.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch (e) {
      console.error("Blob delete failed:", e);
    }

    await prisma.chapterContent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
