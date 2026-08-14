import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PLAN_BY_SLUG, getExamKeysForPlan } from "@/lib/plans";

export type AccessInfo = {
  userId: string | null;
  isAuthed: boolean;
  planSlugs: Set<string>;
  programmeSlugs: Set<string>;
  examKeys: Set<string>;
};

const EMPTY: AccessInfo = {
  userId: null,
  isAuthed: false,
  planSlugs: new Set(),
  programmeSlugs: new Set(),
  examKeys: new Set(),
};

// Returns the plans the current user has PAID for, derived from Payment rows.
// Used to gate premium content (syllabus, previous-year papers, mock tests).
export async function getAccess(): Promise<AccessInfo> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return EMPTY;

  const { prisma } = await import("@/lib/prisma");
  const payments = await prisma.payment.findMany({
    where: { userId, status: "PAID", planSlug: { not: null } },
    select: { planSlug: true },
  });

  const info: AccessInfo = {
    userId,
    isAuthed: true,
    planSlugs: new Set(),
    programmeSlugs: new Set(),
    examKeys: new Set(),
  };

  for (const p of payments) {
    const slug = p.planSlug!;
    const plan = PLAN_BY_SLUG[slug];
    if (!plan) continue;
    info.planSlugs.add(slug);
    if (plan.type === "COURSE" && plan.programmeSlug) {
      info.programmeSlugs.add(plan.programmeSlug);
    }
    if (plan.type === "EXAM") {
      getExamKeysForPlan(plan.examSlug).forEach((k) => info.examKeys.add(k));
    }
  }

  return info;
}
