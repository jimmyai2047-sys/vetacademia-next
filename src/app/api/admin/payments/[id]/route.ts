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
    return { raw: meta };
  }
  return {};
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi(req, { method: "GET" });
  if ("error" in guard) return guard.error;

  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          college: true,
          university: true,
          institution: true,
          programme: true,
          year: true,
          role: true,
          createdAt: true,
        },
      },
      plan: {
        select: {
          slug: true,
          name: true,
          type: true,
          price: true,
          description: true,
          programmeSlug: true,
          examSlug: true,
        },
      },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const meta = parseMeta(payment.metadata);
  const reportId =
    (meta.generatedReportId as string | undefined) ??
    (typeof meta.raw === "string" ? (meta.raw as string) : undefined);

  const report = reportId
    ? await prisma.generatedReport.findUnique({
        where: { id: reportId },
        select: { id: true, title: true, animalType: true, amount: true, status: true },
      })
    : null;

  const history = await prisma.payment.findMany({
    where: { userId: payment.userId },
    orderBy: { createdAt: "desc" },
    include: { plan: { select: { slug: true, name: true } } },
  });

  const historyRows = history.map((h) => ({
    id: h.id,
    amount: h.amount,
    currency: h.currency,
    status: h.status,
    method: h.method || "—",
    orderId: h.orderId || "—",
    paymentId: h.paymentId || "—",
    product: h.plan ? h.plan.name : h.planSlug || "—",
    createdAt: h.createdAt,
  }));

  const paidRows = history.filter((h) => h.status === "PAID");

  return NextResponse.json({
    payment: {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method || "—",
      orderId: payment.orderId || "—",
      paymentId: payment.paymentId || "—",
      product: payment.plan
        ? `${payment.plan.name} (${payment.plan.type})`
        : report
          ? `Project Report — ${report.title} (${report.animalType})`
          : payment.planSlug || "—",
      plan: payment.plan,
      report,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    },
    buyer: payment.user
      ? {
          id: payment.user.id,
          name: payment.user.name || "—",
          email: payment.user.email || "—",
          phone: payment.user.phone || "—",
          address: payment.user.address || "—",
          college: payment.user.college || "—",
          university: payment.user.university || "—",
          institution: payment.user.institution || "—",
          programme: payment.user.programme || "—",
          year: payment.user.year || "—",
          role: payment.user.role || "—",
          memberSince: payment.user.createdAt,
        }
      : null,
    history: historyRows,
    totals: {
      transactions: history.length,
      paid: paidRows.length,
      lifetimePaid: paidRows.reduce((s, h) => s + h.amount, 0),
    },
  });
}
