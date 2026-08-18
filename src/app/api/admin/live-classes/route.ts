import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const classes = await prisma.liveClass.findMany({
      orderBy: [{ scheduledAt: "desc" }],
      include: { _count: { select: { messages: true } } },
    });
    return NextResponse.json(classes);
  } catch (error) {
    console.error("Live classes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, exam, track, subject, youtubeUrl, scheduledAt, duration, isDemo, planSlug, order } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    if (!exam) {
      return NextResponse.json({ error: "Exam category required" }, { status: 400 });
    }
    if (!scheduledAt) {
      return NextResponse.json({ error: "Schedule time required" }, { status: 400 });
    }

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
