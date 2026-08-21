import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";

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
      type,
      content,
      url,
      fileName,
      fileType,
      coverImageUrl,
      subjectId,
      chapterId,
      isDemo,
      isPublic,
    } = body as {
      title?: string;
      type?: string;
      content?: string | null;
      url?: string | null;
      fileName?: string | null;
      fileType?: string | null;
      coverImageUrl?: string | null;
      subjectId?: string | null;
      chapterId?: string | null;
      isDemo?: boolean;
      isPublic?: boolean;
    };

    const existing = await prisma.studyMaterial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // When re-bound to a chapter, derive the owning subject from it.
    let resolvedSubjectId: string | null | undefined = undefined;
    if (chapterId !== undefined) {
      if (chapterId) {
        const chapter = await prisma.chapter.findUnique({
          where: { id: chapterId },
          select: { subjectId: true },
        });
        resolvedSubjectId = chapter?.subjectId ?? subjectId ?? null;
      } else {
        resolvedSubjectId = subjectId ?? null;
      }
    } else {
      resolvedSubjectId = subjectId !== undefined ? subjectId : existing.subjectId;
    }

    const material = await prisma.studyMaterial.update({
      where: { id },
      data: {
        title: title?.trim() ?? existing.title,
        type: type ?? existing.type,
        content:
          content !== undefined
            ? content
              ? sanitizeChapterContent(content)
              : null
            : existing.content,
        url: url !== undefined ? url : existing.url,
        fileName: fileName !== undefined ? fileName : existing.fileName,
        fileType: fileType !== undefined ? fileType : existing.fileType,
        coverImageUrl:
          coverImageUrl !== undefined ? coverImageUrl : existing.coverImageUrl,
        subjectId: resolvedSubjectId,
        chapterId: chapterId !== undefined ? chapterId : existing.chapterId,
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
