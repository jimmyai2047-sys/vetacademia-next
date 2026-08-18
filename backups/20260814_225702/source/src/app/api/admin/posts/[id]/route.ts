import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const { title, category, content, exam, published, file } = body as {
      title?: string;
      category?: string;
      content?: string;
      exam?: string | null;
      published?: boolean;
      file?: {
        url: string;
        fileName: string;
        fileType: string;
        fileSize: number | null;
      } | null;
    };

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title: title?.trim() ?? existing.title,
        category: category ?? existing.category,
        content: content !== undefined ? content : existing.content,
        exam: exam !== undefined ? exam : existing.exam,
        published: published ?? existing.published,
        fileUrl: file?.url !== undefined ? (file?.url || null) : existing.fileUrl,
        fileName:
          file?.fileName !== undefined ? (file?.fileName || null) : existing.fileName,
        fileType:
          file?.fileType !== undefined ? (file?.fileType || null) : existing.fileType,
        fileSize:
          file?.fileSize !== undefined ? (file?.fileSize ?? null) : existing.fileSize,
      },
    });
    return NextResponse.json(post);
  } catch (error) {
    console.error("Post update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Post delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
