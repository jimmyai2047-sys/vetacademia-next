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
    const body = await req.json();
    const {
      category,
      type,
      title,
      description,
      body: chapterBody,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      externalUrl,
      published,
      order,
      subject,
      topic,
      isDemo,
    } = body as {
      category?: string;
      type?: string;
      title?: string;
      description?: string | null;
      body?: string | null;
      fileUrl?: string | null;
      fileName?: string | null;
      fileType?: string | null;
      fileSize?: number | null;
      externalUrl?: string | null;
      published?: boolean;
      order?: number;
      subject?: string | null;
      topic?: string | null;
      isDemo?: boolean;
    };

    const existing = await prisma.examMaterial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const material = await prisma.examMaterial.update({
      where: { id },
      data: {
        category: category ?? existing.category,
        type: type ?? existing.type,
        title: title?.trim() ?? existing.title,
        description:
          description !== undefined ? description : existing.description,
        body:
          chapterBody !== undefined
            ? chapterBody
              ? sanitizeChapterContent(chapterBody)
              : null
            : existing.body,
        fileUrl: fileUrl !== undefined ? fileUrl : existing.fileUrl,
        fileName: fileName !== undefined ? fileName : existing.fileName,
        fileType: fileType !== undefined ? fileType : existing.fileType,
        fileSize: fileSize !== undefined ? fileSize : existing.fileSize,
        externalUrl:
          externalUrl !== undefined ? externalUrl : existing.externalUrl,
        published: published ?? existing.published,
        order: order ?? existing.order,
        subject: subject !== undefined ? subject : existing.subject,
        topic: topic !== undefined ? topic : existing.topic,
        isDemo: isDemo !== undefined ? (isDemo ?? false) : existing.isDemo,
      },
    });
    return NextResponse.json(material);
  } catch (error) {
    console.error("Exam material update error:", error);
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
    await prisma.examMaterial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Exam material delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
