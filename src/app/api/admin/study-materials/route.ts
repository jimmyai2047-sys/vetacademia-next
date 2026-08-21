import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: "desc" },
      include: { subject: { include: { programme: true } } },
    });
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Study materials list error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
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

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    // Resolve the owning subject from the chapter when bound to one.
    let resolvedSubjectId = subjectId || null;
    if (chapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { subjectId: true },
      });
      if (chapter) resolvedSubjectId = chapter.subjectId;
    }

    const material = await prisma.studyMaterial.create({
      data: {
        title: title.trim(),
        type: type || "NOTE",
        content: content ? sanitizeChapterContent(content) : null,
        url: url || null,
        fileName: fileName || null,
        fileType: fileType || null,
        coverImageUrl: coverImageUrl || null,
        subjectId: resolvedSubjectId,
        chapterId: chapterId || null,
        userId: null,
        isDemo: isDemo ?? false,
        isPublic: isPublic ?? true,
      },
    });
    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error("Study material create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
