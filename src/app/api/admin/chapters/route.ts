import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { processInlineImages } from "@/lib/chapter-images";
import { logAudit } from "@/lib/audit";

// Replace-preview (finding 9): the importer shows exactly what would be
// removed before the admin confirms — count + titles + statuses.
export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const subjectId = new URL(req.url).searchParams.get("subjectId");
    if (!subjectId) {
      return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }
    const chapters = await prisma.chapter.findMany({
      where: { subjectId },
      orderBy: { unitNumber: "asc" },
      select: { id: true, title: true, unitNumber: true, status: true },
    });
    return NextResponse.json({ count: chapters.length, chapters });
  } catch (error) {
    console.error("Chapter list error:", error);
    return NextResponse.json({ error: "Failed to list chapters" }, { status: 500 });
  }
}

// Bulk status transitions (finding 9): the import result / subject page can
// publish every DRAFT in one confirmed action.
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const body = await req.json();
    const subjectId: string | undefined = body.subjectId;
    const status = body.status;
    if (!subjectId || (status !== "PUBLISHED" && status !== "DRAFT" && status !== "REVIEW")) {
      return NextResponse.json({ error: "subjectId and a valid status are required" }, { status: 400 });
    }
    const result = await prisma.chapter.updateMany({
      where: { subjectId, ...(body.onlyDrafts ? { status: "DRAFT" } : {}) },
      data: { status },
    });
    logAudit({
      action: status === "PUBLISHED" ? "chapter.publish_all" : "chapter.status_all",
      actor: session.user.id,
      target: subjectId,
      meta: { count: result.count, status, onlyDrafts: Boolean(body.onlyDrafts) },
    });
    return NextResponse.json({ updated: result.count, status });
  } catch (error) {
    console.error("Chapter bulk status error:", error);
    return NextResponse.json({ error: "Failed to update chapters" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const body = await req.json();
    const subjectId: string | undefined = body.subjectId;
    const replace: boolean = Boolean(body.replace);
    const chapters = Array.isArray(body.chapters) ? body.chapters : [];

    if (!subjectId) {
      return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }
    if (chapters.length === 0) {
      return NextResponse.json({ error: "No chapters provided" }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    let deletedCount = 0;
    if (replace) {
      // Snapshot every chapter that is about to disappear (reason "replace").
      // ChapterRevision.chapterId is nullable and SET NULL on delete, so these
      // texts survive the wipe and can be restored as new chapters.
      const existing = await prisma.chapter.findMany({
        where: { subjectId },
        select: { id: true, title: true, content: true, unitNumber: true, status: true },
      });
      if (existing.length > 0) {
        await prisma.$transaction([
          prisma.chapterRevision.createMany({
            data: existing.map((c) => ({
              chapterId: c.id,
              subjectId,
              title: c.title,
              content: c.content,
              unitNumber: c.unitNumber,
              reason: "replace",
              createdBy: session.user.id,
              meta: { statusBefore: c.status },
            })),
          }),
          prisma.chapter.deleteMany({ where: { subjectId } }),
        ]);
        deletedCount = existing.length;
      }
    }

    const created = [];
    for (let i = 0; i < chapters.length; i++) {
      const c = chapters[i] || {};
      const title = typeof c.title === "string" ? c.title.trim() : "";
      const rawContent = typeof c.content === "string" ? c.content : "";
      if (!title) continue;
      // Offload any inline base64 images (e.g. pasted from Word) to Blob.
      const optimized = await processInlineImages(rawContent);
      const createdChapter = await prisma.chapter.create({
        data: {
          subjectId,
          title,
          content: sanitizeChapterContent(optimized),
          unitNumber: typeof c.unitNumber === "number" ? c.unitNumber : i + 1,
          type: c.type === "PRACTICAL" ? "PRACTICAL" : c.type === "THEORY" ? "THEORY" : null,
          author: typeof c.author === "string" ? c.author.trim() || null : null,
          reviewer: typeof c.reviewer === "string" ? c.reviewer.trim() || null : null,
          // Imported/added content starts as DRAFT and goes live only after
          // an explicit publish (finding 9 workflow).
          status: "DRAFT",
        },
      });
      created.push(createdChapter.id);
    }

    logAudit({
      action: replace ? "chapter.replace" : "chapter.create",
      actor: session.user.id,
      target: subjectId,
      meta: { replace, deleted: deletedCount, created: created.length, createdStatus: "DRAFT" },
    });

    return NextResponse.json(
      { created: created.length, createdIds: created, deleted: deletedCount, status: "DRAFT" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Chapter bulk create error:", error);
    return NextResponse.json({ error: "Failed to create chapters" }, { status: 500 });
  }
}
