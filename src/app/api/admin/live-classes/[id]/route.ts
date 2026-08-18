import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const liveClass = await prisma.liveClass.findUnique({
      where: { id },
      include: { _count: { select: { messages: true } } },
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

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();

    const liveClass = await prisma.liveClass.findUnique({ where: { id } });
    if (!liveClass) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.description === "string") data.description = body.description?.trim() || null;
    if (typeof body.exam === "string") data.exam = body.exam;
    if (typeof body.track === "string") data.track = body.track?.trim() || null;
    if (typeof body.subject === "string") data.subject = body.subject?.trim() || null;
    if (typeof body.youtubeUrl === "string") data.youtubeUrl = body.youtubeUrl?.trim() || null;
    if (body.scheduledAt) data.scheduledAt = new Date(body.scheduledAt);
    if (typeof body.duration === "number") data.duration = body.duration;
    if (typeof body.status === "string") data.status = body.status;
    if (typeof body.recordingUrl === "string") data.recordingUrl = body.recordingUrl?.trim() || null;
    if (typeof body.thumbnailUrl === "string") data.thumbnailUrl = body.thumbnailUrl?.trim() || null;
    if (typeof body.isDemo === "boolean") data.isDemo = body.isDemo;
    if (typeof body.planSlug === "string") data.planSlug = body.planSlug?.trim() || null;
    if (typeof body.order === "number") data.order = body.order;

    const updated = await prisma.liveClass.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Live class update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    await prisma.liveClass.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Live class delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
