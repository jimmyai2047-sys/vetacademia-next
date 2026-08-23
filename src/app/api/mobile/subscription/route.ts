import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { PLANS, getExamKeysForPlan } from "@/lib/plans";
import { programmeNameToSlug } from "@/lib/programme";

export async function GET(req: Request) {
  const userId = verifyToken(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = user?.role === "ADMIN";

  const ALL_PLAN_SLUGS = new Set(PLANS.map((p: any) => p.slug));
  const ALL_PROGRAMME_SLUGS = new Set(
    PLANS.filter((p: any) => p.type === "COURSE" && p.programmeSlug).map(
      (p: any) => p.programmeSlug!
    )
  );
  const ALL_EXAM_KEYS = new Set(["psc", "icar-entrance", "net", "ars"]);

  if (isAdmin) {
    return NextResponse.json({
      isAuthed: true,
      isAdmin: true,
      isSubscribed: true,
      planSlugs: [...ALL_PLAN_SLUGS],
      programmeSlugs: [...ALL_PROGRAMME_SLUGS],
      examKeys: [...ALL_EXAM_KEYS],
    });
  }

  const payments = await prisma.payment.findMany({
    where: { userId, status: "PAID", planSlug: { not: null } },
    include: { plan: true },
  });

  const planSlugs = new Set<string>();
  const programmeSlugs = new Set<string>();
  const examKeys = new Set<string>();

  for (const p of payments) {
    const plan = p.plan;
    if (!plan) continue;
    planSlugs.add(p.planSlug!);
    if (plan.type === "COURSE" && plan.programmeSlug && !plan.year && !plan.subjectId) {
      programmeSlugs.add(plan.programmeSlug);
    }
    if (plan.type === "EXAM" && plan.examSlug) {
      getExamKeysForPlan(plan.examSlug).forEach((k: string) => examKeys.add(k));
    }
  }

  return NextResponse.json({
    isAuthed: true,
    isAdmin: false,
    isSubscribed: planSlugs.size > 0,
    planSlugs: [...planSlugs],
    programmeSlugs: [...programmeSlugs],
    examKeys: [...examKeys],
  });
}
