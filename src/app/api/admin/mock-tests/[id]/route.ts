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
    const body = await req.json().catch(() => ({}));
    const {
      title,
      description,
      duration,
      totalMarks,
      subjectId,
      exam,
      track,
      isAdaptive,
      kind,
      year,
      isDemo,
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
      kind?: string;
      year?: string | null;
      isDemo?: boolean;
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

    const resolvedKind = (
      kind ||
      (isAdaptive !== undefined ? (isAdaptive ? "ADAPTIVE" : "MOCK") : existing.kind)
    )?.toUpperCase();
    const kindValue =
      resolvedKind === "PREVIOUS_YEAR" ||
      resolvedKind === "ADAPTIVE" ||
      resolvedKind === "MOCK"
        ? resolvedKind
        : existing.kind;

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
          kindValue === "ADAPTIVE"
            ? true
            : kindValue === "PREVIOUS_YEAR"
            ? false
            : isAdaptive !== undefined
            ? isAdaptive
            : existing.isAdaptive,
        kind: kindValue,
        year:
          kindValue === "PREVIOUS_YEAR"
            ? year !== undefined
              ? year || null
              : existing.year
            : null,
        isDemo: isDemo !== undefined ? (isDemo ?? false) : existing.isDemo,
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
