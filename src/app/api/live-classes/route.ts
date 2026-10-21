import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/access";
import { decorateLiveClasses } from "@/lib/live-class-status";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const exam = searchParams.get("exam");

    const where: Record<string, unknown> = {};
    if (exam) where.exam = exam;

    const classes = await prisma.liveClass.findMany({
      where,
      orderBy: [{ scheduledAt: "desc" }],
      take: 50,
      select: {
        id: true,
        title: true,
        description: true,
        exam: true,
        track: true,
        subject: true,
        scheduledAt: true,
        duration: true,
        status: true,
        youtubeUrl: true,
        recordingUrl: true,
        thumbnailUrl: true,
        isDemo: true,
        planSlug: true,
        _count: { select: { messages: true } },
      },
    });

    // Derive true status from the clock (stored status is a manual field).
    const decorated = decorateLiveClasses(classes);
    const access = await getAccess();
    const result = decorated.map((c) => {
      const allowed =
        c.isDemo ||
        (c.planSlug != null && access.planSlugs.has(c.planSlug)) ||
        access.examKeys.has(c.exam) ||
        access.examPlanOwned;
      if (allowed) return c;
      // Strip both media URLs for learners without access — youtubeUrl is also
      // the signal that promotes SCHEDULED→LIVE, so it must not leak here.
      return { ...c, recordingUrl: null, youtubeUrl: null };
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Live classes fetch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
