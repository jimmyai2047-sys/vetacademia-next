import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { decorateLiveClasses } from "@/lib/live-class-status";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Persisted overdue sweep: stored status is a manual dropdown, so sessions
    // silently stayed LIVE/SCHEDULED forever. Resolve them once, explicitly,
    // and leave a trace. CANCELLED rows are never touched.
    const now = new Date();
    const candidates = await prisma.liveClass.findMany({
      where: { status: { in: ["SCHEDULED", "LIVE"] }, scheduledAt: { lt: now } },
      select: { id: true, scheduledAt: true, duration: true },
    });
    const overdue = candidates.filter(
      (c) => new Date(c.scheduledAt).getTime() + Math.max(0, c.duration) * 60_000 < now.getTime()
    );
    if (overdue.length > 0) {
      const ids = overdue.map((c) => c.id);
      const updated = await prisma.liveClass.updateMany({
        where: { id: { in: ids } },
        data: { status: "ENDED" },
      });
      logAudit({
        action: "liveclass.auto_end_overdue",
        actor: session.user.email ?? null,
        target: `${updated.count} live class(es)`,
        meta: { ids: ids.slice(0, 50) },
      });
    }

    const classes = await prisma.liveClass.findMany({
      orderBy: [{ scheduledAt: "desc" }],
      include: { _count: { select: { messages: true } } },
    });
    // Decorated so the admin UI can show stored vs effective status side by side.
    return NextResponse.json(decorateLiveClasses(classes));
  } catch (error) {
    console.error("Live classes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
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
    const { title, description, exam, track, subject, youtubeUrl, scheduledAt, duration, status, recordingUrl, thumbnailUrl, isDemo, planSlug, order } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    if (!exam) {
      return NextResponse.json({ error: "Exam category required" }, { status: 400 });
    }
    if (!scheduledAt) {
      return NextResponse.json({ error: "Schedule time required" }, { status: 400 });
    }

    const VALID_STATUS = ["SCHEDULED", "LIVE", "ENDED", "CANCELLED"];

    const liveClass = await prisma.liveClass.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        exam,
        track: track?.trim() || null,
        subject: subject?.trim() || null,
        youtubeUrl: youtubeUrl?.trim() || null,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 60,
        // The editor form offers status and a recording URL on creation; both
        // were previously accepted by the form and silently dropped here.
        status: VALID_STATUS.includes(status) ? status : "SCHEDULED",
        recordingUrl: recordingUrl?.trim() || null,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        isDemo: isDemo || false,
        planSlug: planSlug?.trim() || null,
        order: order || 0,
      },
    });

    return NextResponse.json(liveClass, { status: 201 });
  } catch (error) {
    console.error("Live class create error:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
