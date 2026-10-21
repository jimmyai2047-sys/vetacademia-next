import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { readinessIssue } from "@/lib/material-readiness";
import { logAudit } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
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

    if (title !== undefined && !title.trim()) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }

    // Validate the MERGED result, not just the incoming payload — an update
    // that drops the last asset must not be able to publish an empty card.
    const mergedPublished = published ?? existing.published;
    const mergedBody =
      chapterBody !== undefined
        ? chapterBody
          ? sanitizeChapterContent(chapterBody)
          : null
        : existing.body;
    const issue = readinessIssue({
      published: mergedPublished,
      fileUrl: fileUrl !== undefined ? fileUrl : existing.fileUrl,
      externalUrl: externalUrl !== undefined ? externalUrl : existing.externalUrl,
      body: mergedBody,
    });
    if (issue) {
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const material = await prisma.examMaterial.update({
      where: { id },
      data: {
        category: category ?? existing.category,
        type: type ?? existing.type,
        title: title?.trim() ?? existing.title,
        description:
          description !== undefined ? description : existing.description,
        body: mergedBody,
        fileUrl: fileUrl !== undefined ? fileUrl : existing.fileUrl,
        fileName: fileName !== undefined ? fileName : existing.fileName,
        fileType: fileType !== undefined ? fileType : existing.fileType,
        fileSize: fileSize !== undefined ? fileSize : existing.fileSize,
        externalUrl:
          externalUrl !== undefined ? externalUrl : existing.externalUrl,
        published: mergedPublished,
        order: order ?? existing.order,
        subject: subject !== undefined ? subject : existing.subject,
        topic: topic !== undefined ? topic : existing.topic,
        isDemo: isDemo !== undefined ? (isDemo ?? false) : existing.isDemo,
      },
    });
    logAudit({
      action: "exam_material.update",
      actor: session.user.id,
      target: id,
      meta: {
        title: material.title,
        before: {
          published: existing.published,
          isDemo: existing.isDemo,
          fileUrl: existing.fileUrl,
          externalUrl: existing.externalUrl,
        },
        after: {
          published: material.published,
          isDemo: material.isDemo,
          fileUrl: material.fileUrl,
          externalUrl: material.externalUrl,
        },
      },
    });
    return NextResponse.json(material);
  } catch (error) {
    console.error("Exam material update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const { id } = await params;
    const existing = await prisma.examMaterial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.examMaterial.delete({ where: { id } });
    logAudit({
      action: "exam_material.delete",
      actor: session.user.id,
      target: id,
      meta: { title: existing.title, category: existing.category },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Exam material delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
