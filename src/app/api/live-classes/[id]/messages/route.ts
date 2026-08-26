import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccess } from "@/lib/access";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const access = await getAccess();
    const liveClass = await prisma.liveClass.findUnique({
      where: { id },
      select: { isDemo: true, planSlug: true, exam: true },
    });
    if (!liveClass) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const hasAccess =
      liveClass.isDemo ||
      (liveClass.planSlug != null && access.planSlugs.has(liveClass.planSlug)) ||
      access.examKeys.has(liveClass.exam) ||
      access.examPlanOwned;
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const after = searchParams.get("after"); // ISO timestamp for polling

    const where: Record<string, unknown> = { liveClassId: id };
    if (after) {
      where.createdAt = { gt: new Date(after) };
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Chat fetch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const text = body.text?.trim();

    if (!text || text.length > 500) {
      return NextResponse.json({ error: "Message 1-500 characters" }, { status: 400 });
    }

    const access = await getAccess();
    const liveClass = await prisma.liveClass.findUnique({
      where: { id },
      select: { status: true, isDemo: true, planSlug: true, exam: true },
    });
    if (!liveClass || liveClass.status === "CANCELLED") {
      return NextResponse.json({ error: "Live class not available" }, { status: 400 });
    }
    const hasAccess =
      liveClass.isDemo ||
      (liveClass.planSlug != null && access.planSlugs.has(liveClass.planSlug)) ||
      access.examKeys.has(liveClass.exam) ||
      access.examPlanOwned;
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const message = await prisma.chatMessage.create({
      data: {
        liveClassId: id,
        userId,
        text,
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Chat send error:", error);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
