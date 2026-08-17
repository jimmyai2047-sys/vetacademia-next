import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const LIVE_WINDOW_MS = 5 * 60 * 1000;

export async function GET() {
  try {
    const fiveMinAgo = new Date(Date.now() - LIVE_WINDOW_MS);
    const [live, counter] = await Promise.all([
      prisma.siteVisit.count({ where: { lastSeen: { gt: fiveMinAgo } } }),
      prisma.siteCounter.findUnique({ where: { id: "total" } }),
    ]);
    return NextResponse.json({ total: counter?.total ?? 0, live });
  } catch {
    return NextResponse.json({ total: 0, live: 0 });
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    let visitorId = cookieStore.get("va_vid")?.value;
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      cookieStore.set("va_vid", visitorId, {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    const fiveMinAgo = new Date(Date.now() - LIVE_WINDOW_MS);

    const existing = await prisma.siteVisit.findFirst({ where: { visitorId } });
    let total = 0;
    if (existing) {
      await prisma.siteVisit.update({
        where: { id: existing.id },
        data: { lastSeen: new Date() },
      });
      total = (await prisma.siteCounter.findUnique({ where: { id: "total" } }))
        ?.total ?? 0;
    } else {
      await prisma.siteVisit.create({ data: { visitorId } });
      total = (
        await prisma.siteCounter.upsert({
          where: { id: "total" },
          create: { id: "total", total: 1 },
          update: { total: { increment: 1 } },
        })
      ).total;
    }

    // Throttled cleanup of stale visits (avoid a full-table scan on every hit).
    if (Math.random() < 0.05) {
      await prisma.siteVisit
        .deleteMany({ where: { lastSeen: { lt: fiveMinAgo } } })
        .catch(() => {});
    }

    const live = await prisma.siteVisit.count({
      where: { lastSeen: { gt: fiveMinAgo } },
    });

    return NextResponse.json({ total, live });
  } catch {
    return NextResponse.json({ total: 0, live: 0 });
  }
}
