import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    if (typeof body.status === "string") {
      // Guard the enum: an unknown value would otherwise fail deep inside
      // Prisma and surface as a generic 500.
      if (["SCHEDULED", "LIVE", "ENDED", "CANCELLED"].includes(body.status)) {
        data.status = body.status;
      } else {
        return NextResponse.json({ error: "Unknown status value" }, { status: 400 });
      }
    }
    if (typeof body.recordingUrl === "string") data.recordingUrl = body.recordingUrl?.trim() || null;
    if (typeof body.thumbnailUrl === "string") data.thumbnailUrl = body.thumbnailUrl?.trim() || null;
    if (typeof body.isDemo === "boolean") data.isDemo = body.isDemo;
    if (typeof body.planSlug === "string") data.planSlug = body.planSlug?.trim() || null;
    if (typeof body.order === "number") data.order = body.order;

    const updated = await prisma.liveClass.update({ where: { id }, data });
    logAudit({
      action: "liveClass.update",
      actor: session.user.id,
      target: id,
      meta: {
        title: updated.title,
        ...(liveClass.status !== updated.status
          ? { statusFrom: liveClass.status, statusTo: updated.status }
          : {}),
        ...(liveClass.isDemo !== updated.isDemo
          ? { demoFrom: liveClass.isDemo, demoTo: updated.isDemo }
          : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Live class update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
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
    const existing = await prisma.liveClass.findUnique({
      where: { id },
      select: { title: true, status: true },
    });
    await prisma.liveClass.delete({ where: { id } });
    logAudit({
      action: "liveClass.delete",
      actor: session.user.id,
      target: id,
      meta: {
        title: existing?.title ?? "unknown",
        status: existing?.status ?? "unknown",
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Live class delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
