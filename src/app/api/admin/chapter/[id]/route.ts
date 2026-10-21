import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { processInlineImages } from "@/lib/chapter-images";
import { sanitizeChapterContent } from "@/lib/content";
import { logAudit } from "@/lib/audit";

const WORKFLOW_STATUSES = ["DRAFT", "REVIEW", "PUBLISHED"] as const;
type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];
function isWorkflowStatus(v: unknown): v is WorkflowStatus {
  return WORKFLOW_STATUSES.includes(v as WorkflowStatus);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const body = await req.json();

    const current = await prisma.chapter.findUnique({
      where: { id },
      select: { id: true, title: true, content: true, unitNumber: true, subjectId: true, status: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (typeof body.title === "string" && body.title.trim()) {
      data.title = body.title.trim();
    }
    if (typeof body.content === "string") {
      data.content = sanitizeChapterContent(await processInlineImages(body.content));
    }
    if (typeof body.unitNumber === "number" && body.unitNumber > 0) {
      data.unitNumber = body.unitNumber;
    }
    if (body.type === "THEORY" || body.type === "PRACTICAL") {
      data.type = body.type;
    }
    if (typeof body.author === "string") {
      data.author = body.author.trim() || null;
    }
    if (typeof body.reviewer === "string") {
      data.reviewer = body.reviewer.trim() || null;
    }
    if (typeof body.isDemo === "boolean") {
      data.isDemo = body.isDemo;
    }

    // Editorial workflow (finding 9): DRAFT → REVIEW → PUBLISHED.
    let nextStatus: string | undefined;
    if (typeof body.status === "string" && isWorkflowStatus(body.status)) {
      nextStatus = body.status;
      if (nextStatus !== current.status) data.status = nextStatus;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Snapshot the PREVIOUS text whenever the body itself is about to be
    // overwritten (save / title change), so every version stays recoverable.
    const bodyChanged =
      "title" in data || "content" in data || "unitNumber" in data || "type" in data;
    const reason = typeof body.content === "string" ? "save" : "title";

    if (bodyChanged) {
      await prisma.$transaction([
        prisma.chapterRevision.create({
          data: {
            chapterId: current.id,
            subjectId: current.subjectId,
            title: current.title,
            content: current.content,
            unitNumber: current.unitNumber,
            reason,
            createdBy: session.user.id,
            meta: { statusBefore: current.status },
          },
        }),
        prisma.chapter.update({ where: { id }, data }),
      ]);
    } else {
      await prisma.chapter.update({ where: { id }, data });
    }

    const changedFields = Object.keys(data);
    logAudit({
      action: nextStatus === "PUBLISHED" && current.status !== "PUBLISHED" ? "chapter.publish" : "chapter.update",
      actor: session.user.id,
      target: id,
      meta: {
        fields: changedFields,
        ...(nextStatus && nextStatus !== current.status
          ? { status: { from: current.status, to: nextStatus } }
          : {}),
        ...(bodyChanged ? { snapshot: reason } : {}),
      },
    });

    const updated = await prisma.chapter.findUnique({
      where: { id },
      select: { id: true, title: true, content: true, unitNumber: true, type: true, isDemo: true, status: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Chapter update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
