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
      description,
      duration,
      totalMarks,
      subjectId,
      exam,
      track,
      isAdaptive,
      file,
    } = body as {
      title?: string;
      description?: string;
      duration?: number;
      totalMarks?: number;
      subjectId?: string | null;
      exam?: string | null;
      track?: string | null;
      isAdaptive?: boolean;
      file?: {
        url: string;
        fileName: string;
        fileType: string;
      } | null;
    };

    const existing = await prisma.mockTest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const test = await prisma.mockTest.update({
      where: { id },
      data: {
        title: title?.trim() ?? existing.title,
        description: description !== undefined ? description : existing.description,
        duration: duration ?? existing.duration,
        totalMarks: totalMarks ?? existing.totalMarks,
        subjectId: subjectId !== undefined ? subjectId : existing.subjectId,
        exam: exam !== undefined ? exam : existing.exam,
        track: track !== undefined ? track : existing.track,
        isAdaptive:
          isAdaptive !== undefined ? isAdaptive : existing.isAdaptive,
        fileUrl: file?.url !== undefined ? (file?.url || null) : existing.fileUrl,
        fileName:
          file?.fileName !== undefined ? (file?.fileName || null) : existing.fileName,
        fileType:
          file?.fileType !== undefined ? (file?.fileType || null) : existing.fileType,
      },
    });
    return NextResponse.json(test);
  } catch (error) {
    console.error("Mock test update error:", error);
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
    await prisma.mockTest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mock test delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
