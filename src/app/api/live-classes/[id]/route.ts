import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const liveClass = await prisma.liveClass.findUnique({
      where: { id },
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
    if (!liveClass) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(liveClass);
  } catch (error) {
    console.error("Live class fetch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
