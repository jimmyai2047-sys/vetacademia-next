import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
        youtubeUrl: true,
        scheduledAt: true,
        duration: true,
        status: true,
        recordingUrl: true,
        thumbnailUrl: true,
        isDemo: true,
        planSlug: true,
      },
    });

    // Derive true status from the clock (stored status is a manual field).
    const result = decorateLiveClasses(classes).map((c) => ({
      ...c,
      recordingUrl: c.isDemo || !c.planSlug ? c.recordingUrl : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Mobile live classes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
