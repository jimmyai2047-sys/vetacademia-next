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
    const {
      title,
      type,
      content,
      url,
      subjectId,
      isDemo,
      isPublic,
    } = body as {
      title?: string;
      type?: string;
      content?: string | null;
      url?: string | null;
      subjectId?: string | null;
      isDemo?: boolean;
      isPublic?: boolean;
    };

    const existing = await prisma.studyMaterial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const material = await prisma.studyMaterial.update({
      where: { id },
      data: {
        title: title?.trim() ?? existing.title,
        type: type ?? existing.type,
        content: content !== undefined ? content : existing.content,
        url: url !== undefined ? url : existing.url,
        subjectId: subjectId !== undefined ? subjectId : existing.subjectId,
        isDemo: isDemo !== undefined ? (isDemo ?? false) : existing.isDemo,
        isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
      },
    });
    return NextResponse.json(material);
  } catch (error) {
    console.error("Study material update error:", error);
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
    await prisma.studyMaterial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Study material delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
