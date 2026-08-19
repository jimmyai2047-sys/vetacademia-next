import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/access";

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
        recordingUrl: true,
        thumbnailUrl: true,
        isDemo: true,
        planSlug: true,
        _count: { select: { messages: true } },
      },
    });

    const access = await getAccess();
    const result = classes.map((c) => {
      const allowed =
        c.isDemo ||
        (c.planSlug != null && access.planSlugs.has(c.planSlug)) ||
        access.examKeys.has(c.exam) ||
        access.examPlanOwned;
      if (allowed) return c;
      const { recordingUrl, ...rest } = c;
      return { ...rest, recordingUrl: null };
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Live classes fetch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
