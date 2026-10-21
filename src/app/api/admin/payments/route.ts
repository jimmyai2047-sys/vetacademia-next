import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseMeta(meta: string | null): Record<string, unknown> {
  if (!meta) return {};
  try {
    const obj = JSON.parse(meta);
    if (obj && typeof obj === "object") return obj as Record<string, unknown>;
  } catch {
    // legacy plain-string metadata (e.g. raw generatedReportId)
    return { raw: meta };
  }
  return {};
}

export async function GET(req: Request) {
  const guard = await requireAdminApi(req, { method: "GET" });
  if ("error" in guard) return guard.error;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10) || 20)
  );
  const status = (url.searchParams.get("status") || "ALL").toUpperCase();
  // Scope of the money figures: ALL | LIVE (real collections) | TEST (internal
  // test / gateway test-mode rows, never counted as revenue).
  const method = (url.searchParams.get("method") || "ALL").toUpperCase();
  const search = (url.searchParams.get("search") || "").trim();
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  // LIVE is an explicit OR so legacy rows with method = null stay included —
  // never rely on Prisma `not` semantics against a nullable column. Wrapped in
  // AND so it composes with the search OR below instead of clobbering it.
  const liveClause = { OR: [{ method: null }, { method: { not: "TEST" } }] };
  const testClause = { method: "TEST" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (["PENDING", "PAID", "FAILED", "CANCELLED"].includes(status)) {
    where.status = status;
  }
  if (method === "LIVE") where.AND = [liveClause];
  if (method === "TEST") where.AND = [testClause];
  if (from || to) {
    where.createdAt = {};
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) where.createdAt.gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        where.createdAt.lte = d;
      }
    }
  }
  if (search) {
    where.OR = [
      { paymentId: { contains: search } },
      { orderId: { contains: search } },
      { planSlug: { contains: search } },
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
      { user: { phone: { contains: search } } },
    ];
  }

  const skip = (page - 1) * pageSize;

  const paidWhere = { ...where, status: "PAID" };
  // Both money figures are computed inside the SAME filter scope as the rows,
  // so the summary always describes the list being looked at.
  const paidLiveWhere = {
    ...paidWhere,
    AND: [...(paidWhere.AND ?? []), liveClause],
  };
  const paidTestWhere = {
    ...paidWhere,
    AND: [...(paidWhere.AND ?? []), testClause],
  };
  // Abandoned checkouts: PENDING rows sitting for more than a day are almost
  // never going to be paid, so they are reported apart from fresh pendings
  // instead of inflating one undifferentiated "pending" bucket.
  const agedPendingWhere = {
    ...where,
    status: "PENDING",
    createdAt: {
      ...((where.createdAt as Record<string, Date> | undefined) ?? {}),
      lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  };

  const [
    rows,
    total,
    grouped,
    collectedLive,
    collectedTest,
    paidLiveCount,
    paidTestCount,
    pendingAgedCount,
  ] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            college: true,
            institution: true,
            programme: true,
            year: true,
          },
        },
        plan: { select: { slug: true, name: true, type: true, price: true, validityDays: true } },
      },
    }),
    prisma.payment.count({ where }),
    prisma.payment.groupBy({ by: ["status"], where, _count: { status: true } }),
    prisma.payment.aggregate({
      where: paidLiveWhere,
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: paidTestWhere,
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: paidLiveWhere }),
    prisma.payment.count({ where: paidTestWhere }),
    prisma.payment.count({ where: agedPendingWhere }),
  ]);

  // Resolve GeneratedReport purchases stored as metadata { generatedReportId }
  const reportIds = new Set<string>();
  const metas = rows.map((p) => parseMeta(p.metadata));
  for (const m of metas) {
    const id =
      (m.generatedReportId as string | undefined) ??
      (typeof m.raw === "string" ? (m.raw as string) : undefined);
    if (id && typeof id === "string") reportIds.add(id);
  }
  const reports = reportIds.size
    ? await prisma.generatedReport.findMany({
        where: { id: { in: [...reportIds] } },
        select: { id: true, title: true, animalType: true, amount: true },
      })
    : [];
  const reportById = new Map(reports.map((r) => [r.id, r]));

  const payments = rows.map((p, i) => {
    const m = metas[i];
    const rid =
      (m.generatedReportId as string | undefined) ??
      (typeof m.raw === "string" ? (m.raw as string) : undefined);
    const report = rid ? reportById.get(rid) : undefined;
    const product = p.plan
      ? `${p.plan.name} (${p.plan.type})`
      : report
        ? `Project Report — ${report.title} (${report.animalType})`
        : p.planSlug || (rid ? "Project Report" : "—");
    return {
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      method: p.method || "—",
      orderId: p.orderId || "—",
      paymentId: p.paymentId || "—",
      product,
      planSlug: p.planSlug || null,
      expiresAt: p.expiresAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      buyer: {
        name: p.user?.name || "—",
        email: p.user?.email || "—",
        phone: p.user?.phone || "—",
        address: p.user?.address || "—",
        college: p.user?.college || p.user?.institution || "—",
        programme: p.user?.programme || "—",
        year: p.user?.year || "—",
      },
    };
  });

  const countBy = (s: string) =>
    grouped.find((g) => g.status === s)?._count.status ?? 0;

  return NextResponse.json({
    payments,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    summary: {
      // `collected` is LIVE money only — TEST / test-mode rows never count as
      // revenue. `collectedTest` stays visible so tests remain auditable.
      collected: collectedLive._sum.amount ?? 0,
      collectedTest: collectedTest._sum.amount ?? 0,
      paidLive: paidLiveCount,
      paidTest: paidTestCount,
      paid: countBy("PAID"),
      pending: countBy("PENDING"),
      pendingAged: pendingAgedCount,
      failed: countBy("FAILED"),
    },
  });
}
