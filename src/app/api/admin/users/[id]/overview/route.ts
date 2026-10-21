import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { getAccessForUser } from "@/lib/access";

export const dynamic = "force-dynamic";

// Support view for one learner: profile, the entitlements the platform
// actually derives from their payments, learning progress and report orders.
// Access is recomputed through the SAME accessFromPayments rules that gate
// content, so this page can never drift from what the user really sees.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi(req, { method: "GET" });
  if ("error" in guard) return guard.error;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      banned: true,
      programme: true,
      year: true,
      college: true,
      university: true,
      institution: true,
      address: true,
      createdAt: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [access, payments, progressAgg, progressRows, reports] =
    await Promise.all([
      getAccessForUser(id),
      prisma.payment.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        include: {
          plan: {
            select: {
              name: true,
              type: true,
              price: true,
              validityDays: true,
              programmeSlug: true,
              examSlug: true,
              year: true,
              subjectId: true,
            },
          },
        },
      }),
      prisma.userProgress.aggregate({
        where: { userId: id },
        _count: { _all: true },
        _avg: { progress: true },
      }),
      prisma.userProgress.findMany({
        where: { userId: id },
        orderBy: { lastAccessed: "desc" },
        take: 12,
        select: {
          subjectId: true,
          progress: true,
          lastAccessed: true,
          subject: {
            select: { name: true, year: true, programme: { select: { name: true } } },
          },
        },
      }),
      prisma.generatedReport.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          animalType: true,
          status: true,
          amount: true,
          paymentId: true,
          blobUrl: true,
          createdAt: true,
        },
      }),
    ]);

  const now = Date.now();
  const isTest = (m: string | null) => m === "TEST";

  const entitlements = payments
    .filter((p) => p.status === "PAID")
    .map((p) => ({
      id: p.id,
      planName: p.plan?.name || p.planSlug || "—",
      type: p.plan?.type || "—",
      amount: p.amount,
      method: p.method || "—",
      test: isTest(p.method),
      active: !p.expiresAt || p.expiresAt.getTime() > now,
      expiresAt: p.expiresAt,
      createdAt: p.createdAt,
    }));

  const paidLive = payments.filter((p) => p.status === "PAID" && !isTest(p.method));
  const paidTest = payments.filter((p) => p.status === "PAID" && isTest(p.method));

  const subjectIds = [...access.ownedSubjectIds];
  const subjects = subjectIds.length
    ? await prisma.subject.findMany({
        where: { id: { in: subjectIds } },
        select: { id: true, name: true },
      })
    : [];
  const subjectById = new Map(subjects.map((s) => [s.id, s.name]));

  const chips: string[] = [];
  for (const s of access.planSlugs) chips.push(`plan:${s}`);
  for (const p of access.programmeSlugs) chips.push(`course:${p}`);
  for (const e of access.examKeys) chips.push(`exam:${e}`);
  for (const y of access.ownedYearScopes) chips.push(`year:${y}`);
  for (const s of access.ownedSubjectIds) chips.push(`subject:${subjectById.get(s) ?? s}`);

  return NextResponse.json({
    user,
    access: {
      isAdmin: access.isAdmin,
      planSlugs: [...access.planSlugs],
      programmeSlugs: [...access.programmeSlugs],
      examKeys: [...access.examKeys],
      yearScopes: [...access.ownedYearScopes],
      subjectIds,
      chips,
    },
    entitlements,
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      method: p.method || "—",
      planName: p.plan?.name || p.planSlug || "—",
      expiresAt: p.expiresAt,
      active: p.status === "PAID" && (!p.expiresAt || p.expiresAt.getTime() > now),
      createdAt: p.createdAt,
    })),
    progress: {
      subjects: progressAgg._count._all,
      average: Math.round((progressAgg._avg.progress ?? 0) * 10) / 10,
      lastAccessed:
        progressRows.length > 0
          ? progressRows.reduce(
              (max, r) => (r.lastAccessed > max ? r.lastAccessed : max),
              progressRows[0].lastAccessed
            )
          : null,
      top: progressRows.map((r) => ({
        subjectId: r.subjectId,
        name: r.subject.name,
        year: r.subject.year,
        programme: r.subject.programme.name,
        progress: r.progress,
        lastAccessed: r.lastAccessed,
      })),
    },
    reports: reports.map((r) => ({
      id: r.id,
      title: r.title,
      animalType: r.animalType,
      status: r.status,
      amount: r.amount,
      paymentId: r.paymentId,
      hasFile: Boolean(r.blobUrl),
      createdAt: r.createdAt,
    })),
    summary: {
      transactions: payments.length,
      paid: paidLive.length + paidTest.length,
      paidLive: paidLive.length,
      paidTest: paidTest.length,
      liveTotal: paidLive.reduce((s, p) => s + p.amount, 0),
      testTotal: paidTest.reduce((s, p) => s + p.amount, 0),
      reports: reports.length,
      reportsPaid: reports.filter((r) => r.status === "PAID").length,
    },
  });
}
