import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// Version history (finding 9): list snapshots for a chapter or a whole
// subject (subject scope also surfaces snapshots orphaned by a bulk replace).
export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sp = new URL(req.url).searchParams;
    const chapterId = sp.get("chapterId");
    const subjectId = sp.get("subjectId");
    if (!chapterId && !subjectId) {
      return NextResponse.json({ error: "chapterId or subjectId is required" }, { status: 400 });
    }
    const revisions = await prisma.chapterRevision.findMany({
      where: chapterId ? { chapterId } : { subjectId: subjectId! },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        chapterId: true,
        subjectId: true,
        title: true,
        unitNumber: true,
        reason: true,
        createdBy: true,
        meta: true,
        createdAt: true,
      },
    });
    return NextResponse.json(
      revisions.map((r) => ({
        id: r.id,
        chapterId: r.chapterId,
        subjectId: r.subjectId,
        title: r.title,
        unitNumber: r.unitNumber,
        reason: r.reason,
        createdBy: r.createdBy,
        createdAt: r.createdAt,
        // `null` chapterId = the source chapter was deleted by a replace.
        orphaned: r.chapterId === null,
        statusBefore:
          r.meta && typeof r.meta === "object" && "statusBefore" in (r.meta as object)
            ? ((r.meta as { statusBefore?: string }).statusBefore ?? null)
            : null,
      }))
    );
  } catch (error) {
    console.error("Chapter revisions list error:", error);
    return NextResponse.json({ error: "Failed to load revisions" }, { status: 500 });
  }
}

// Restore (finding 9): attached revisions roll the chapter text back (the
// current text is snapshotted first with reason "restore"); orphaned
// revisions from a bulk replace are re-created as a new DRAFT chapter.
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
    const revisionId: string | undefined = body.revisionId;
    if (!revisionId) {
      return NextResponse.json({ error: "revisionId is required" }, { status: 400 });
    }

    const revision = await prisma.chapterRevision.findUnique({ where: { id: revisionId } });
    if (!revision) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 });
    }

    if (revision.chapterId) {
      const current = await prisma.chapter.findUnique({
        where: { id: revision.chapterId },
        select: { id: true, title: true, content: true, unitNumber: true, subjectId: true, status: true },
      });
      if (!current) {
        // Chapter vanished between listing and restore — fall through to
        // re-creation using the revision's own subject context.
        const recreated = await prisma.chapter.create({
          data: {
            subjectId: revision.subjectId,
            title: revision.title,
            content: revision.content,
            unitNumber: revision.unitNumber,
            status: "DRAFT",
          },
        });
        logAudit({
          action: "chapter.restore",
          actor: session.user.id,
          target: recreated.id,
          meta: { revisionId, recreated: true, asStatus: "DRAFT" },
        });
        return NextResponse.json({ restored: recreated.id, recreated: true, status: "DRAFT" });
      }

      await prisma.$transaction([
        prisma.chapterRevision.create({
          data: {
            chapterId: current.id,
            subjectId: current.subjectId,
            title: current.title,
            content: current.content,
            unitNumber: current.unitNumber,
            reason: "restore",
            createdBy: session.user.id,
            meta: { statusBefore: current.status, restoredFrom: revision.id },
          },
        }),
        prisma.chapter.update({
          where: { id: current.id },
          data: { title: revision.title, content: revision.content, unitNumber: revision.unitNumber },
        }),
      ]);

      logAudit({
        action: "chapter.restore",
        actor: session.user.id,
        target: current.id,
        meta: { revisionId, restoredTitle: revision.title },
      });
      return NextResponse.json({ restored: current.id, recreated: false });
    }

    // Orphaned snapshot (bulk replace) → new DRAFT chapter.
    const created = await prisma.chapter.create({
      data: {
        subjectId: revision.subjectId,
        title: revision.title,
        content: revision.content,
        unitNumber: revision.unitNumber,
        status: "DRAFT",
      },
    });
    logAudit({
      action: "chapter.restore",
      actor: session.user.id,
      target: created.id,
      meta: { revisionId, recreated: true, asStatus: "DRAFT", fromReplace: true },
    });
    return NextResponse.json({ restored: created.id, recreated: true, status: "DRAFT" });
  } catch (error) {
    console.error("Chapter restore error:", error);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
