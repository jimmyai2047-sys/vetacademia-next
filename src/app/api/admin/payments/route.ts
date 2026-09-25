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
  const search = (url.searchParams.get("search") || "").trim();
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (["PENDING", "PAID", "FAILED", "CANCELLED"].includes(status)) {
    where.status = status;
  }
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

  const [rows, total, grouped, collected] = await Promise.all([
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
      where: { ...where, status: "PAID" },
      _sum: { amount: true },
    }),
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
      collected: collected._sum.amount ?? 0,
      paid: countBy("PAID"),
      pending: countBy("PENDING"),
      failed: countBy("FAILED"),
    },
  });
}
