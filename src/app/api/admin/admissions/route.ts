import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { isEnquiryStatus, isOpenEnquiryStatus } from "@/lib/enquiry-status";

// GET: list enquiries with search + status/owner filters, plus the admin list
// for owner assignment. Data volumes are small, so the client loads the whole
// filtered set once and filters/exports locally.
export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const status = url.searchParams.get("status");
    const owner = url.searchParams.get("owner");

    const where = {
      ...(status && status !== "ALL" ? { status } : {}),
      ...(owner ? { owner } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { studentMobile: { contains: q } },
              { parentMobile: { contains: q } },
              { programme: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, statusCounts, admins] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 1000,
        select: {
          id: true,
          fullName: true,
          fatherName: true,
          email: true,
          studentMobile: true,
          parentMobile: true,
          programme: true,
          yearOrSemester: true,
          category: true,
          tsp: true,
          status: true,
          owner: true,
          nextActionAt: true,
          userId: true,
          createdAt: true,
        },
      }),
      prisma.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.user.findMany({
        where: { role: "ADMIN" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
      }),
    ]);

    return NextResponse.json({
      items,
      total: items.length,
      statusCounts: Object.fromEntries(
        statusCounts.map((s) => [s.status, s._count._all])
      ) as Record<string, number>,
      openCount: await prisma.enquiry.count({
        where: { status: { in: ["NEW", "CONTACTED", "FOLLOW_UP"] } },
      }),
      overdueCount: await prisma.enquiry.count({
        where: {
          nextActionAt: { lt: new Date() },
          status: { in: ["NEW", "CONTACTED", "FOLLOW_UP"] },
        },
      }),
      admins,
    });
  } catch (error) {
    console.error("Admissions list error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH: update follow-up fields (status / owner / next action / linked user).
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.enquiry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if ("status" in body) {
      if (!isEnquiryStatus(body.status)) {
        return NextResponse.json(
          { error: "status must be NEW, CONTACTED, FOLLOW_UP, CONVERTED or CLOSED" },
          { status: 400 }
        );
      }
      data.status = body.status;
    }
    if ("owner" in body) {
      if (body.owner === null || typeof body.owner === "string") {
        data.owner = body.owner ? body.owner.trim() : null;
      }
    }
    if ("nextActionAt" in body) {
      if (body.nextActionAt === null) {
        data.nextActionAt = null;
      } else if (typeof body.nextActionAt === "string") {
        const d = new Date(body.nextActionAt);
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ error: "nextActionAt must be a date" }, { status: 400 });
        }
        data.nextActionAt = d;
      }
    }
    if ("userId" in body) {
      if (body.userId === null) {
        data.userId = null;
      } else if (typeof body.userId === "string") {
        const user = await prisma.user.findUnique({
          where: { id: body.userId },
          select: { id: true },
        });
        if (!user) {
          return NextResponse.json({ error: "Linked user not found" }, { status: 404 });
        }
        data.userId = user.id;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.enquiry.update({ where: { id }, data });
    logAudit({
      action: "enquiry.update",
      actor: session.user.id,
      target: id,
      meta: {
        fields: Object.keys(data),
        status: updated.status,
        owner: updated.owner,
        open: isOpenEnquiryStatus(updated.status),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admission enquiry update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
