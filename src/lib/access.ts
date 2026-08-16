import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PLAN_BY_SLUG, getExamKeysForPlan } from "@/lib/plans";
import { programmeNameToSlug } from "@/lib/programme";

export type AccessInfo = {
  userId: string | null;
  isAuthed: boolean;
  planSlugs: Set<string>;
  programmeSlugs: Set<string>;
  examKeys: Set<string>;
  examPlanOwned: boolean;
  // Scopes for granular purchases:
  ownedYearScopes: Set<string>; // `${programmeSlug}:${year}` (BVSc/AHDP year plans)
  ownedSubjectIds: Set<string>; // subject ids (MVSc/PhD subject plans)
};

const EMPTY: AccessInfo = {
  userId: null,
  isAuthed: false,
  planSlugs: new Set(),
  programmeSlugs: new Set(),
  examKeys: new Set(),
  examPlanOwned: false,
  ownedYearScopes: new Set(),
  ownedSubjectIds: new Set(),
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
    include: { plan: true },
  });

  const info: AccessInfo = {
    userId,
    isAuthed: true,
    planSlugs: new Set(),
    programmeSlugs: new Set(),
    examKeys: new Set(),
    examPlanOwned: false,
    ownedYearScopes: new Set(),
    ownedSubjectIds: new Set(),
  };

  for (const p of payments) {
    const slug = p.planSlug!;
    const plan = p.plan;
    if (!plan) continue;
    info.planSlugs.add(slug);
    if (plan.type === "COURSE" && plan.programmeSlug && !plan.year && !plan.subjectId) {
      info.programmeSlugs.add(plan.programmeSlug);
    }
    if (plan.type === "EXAM" && plan.examSlug) {
      info.examPlanOwned = true;
      getExamKeysForPlan(plan.examSlug).forEach((k) => info.examKeys.add(k));
    }
    if (plan.year && plan.programmeSlug) {
      info.ownedYearScopes.add(`${plan.programmeSlug}:${plan.year}`);
    }
    if (plan.subjectId) {
      info.ownedSubjectIds.add(plan.subjectId);
    }
  }

  return info;
}

// Returns whether the current user may take a given mock/adaptive/PYQ test.
// Mirrors the gating used by the /mock-tests/[id] and /papers/[id] pages so
// the attempt-save API cannot be bypassed by calling it directly.
export async function canAccessMockTest(test: {
  subjectId?: string | null;
  exam?: string | null;
}): Promise<boolean> {
  const access = await getAccess();
  if (!access.isAuthed) return false;

  if (test.exam) {
    return access.examKeys.has(test.exam) || access.examPlanOwned;
  }

  if (test.subjectId) {
    const { prisma } = await import("@/lib/prisma");
    const subject = await prisma.subject.findUnique({
      where: { id: test.subjectId },
      select: { id: true, year: true, programme: { select: { name: true } } },
    });
    if (!subject) return false;
    const progSlug = programmeNameToSlug(subject.programme.name);
    const programmeOwned = access.programmeSlugs.has(progSlug);
    const yearOwned =
      (progSlug === "bvsc" || progSlug === "ahdp") && subject.year
        ? access.ownedYearScopes.has(`${progSlug}:${subject.year}`)
        : false;
    const subjectOwned = access.ownedSubjectIds.has(subject.id);
    return programmeOwned || yearOwned || subjectOwned;
  }

  // Free general test (no programme, no exam): open to any signed-in user.
  return access.isAuthed;
}
