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
          validityDays: true,
          description: true,
          programmeSlug: true,
          examSlug: true,
          year: true,
          subjectId: true,
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
  // TEST / test-mode rows are excluded from the revenue figure but kept
  // visible as `lifetimeTest` so they stay auditable.
  const isTest = (h: { method: string | null }) => h.method === "TEST";
  const lifetimePaid = paidRows.filter((h) => !isTest(h)).reduce((s, h) => s + h.amount, 0);
  const lifetimeTest = paidRows.filter(isTest).reduce((s, h) => s + h.amount, 0);

  // Is THIS checkout currently granting anything? Mirrors activeAccessFilter:
  // PAID + (null expiresAt = lifetime, or a future expiry).
  const active =
    payment.status === "PAID" &&
    (!payment.expiresAt || payment.expiresAt.getTime() > Date.now());

  // The concrete scope this purchase unlocks — same rules accessFromPayments
  // applies, so support can answer "what did this buy?" without guessing.
  const grants: string[] = [];
  if (payment.plan) {
    const p = payment.plan;
    if (p.type === "COURSE" && p.programmeSlug && !p.year && !p.subjectId) {
      grants.push(`Full course: ${p.programmeSlug}`);
    }
    if (p.type === "EXAM" && p.examSlug) grants.push(`Exam pack: ${p.examSlug}`);
    if (p.year && p.programmeSlug) grants.push(`Year scope: ${p.programmeSlug}:${p.year}`);
    if (p.subjectId) grants.push(`Subject: ${p.subjectId}`);
    if (!grants.length) grants.push(`Plan: ${p.slug}`);
  } else if (report) {
    grants.push(`Report download: ${report.title}`);
  } else if (payment.planSlug) {
    grants.push(`Plan: ${payment.planSlug}`);
  } else {
    grants.push("No content scope (top-up / legacy row)");
  }

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
      planSlug: payment.planSlug,
      expiresAt: payment.expiresAt,
      active,
      grants,
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
      lifetimePaid,
      lifetimeTest,
    },
  });
}
