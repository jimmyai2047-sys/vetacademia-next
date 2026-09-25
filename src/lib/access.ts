import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PLANS, getExamKeysForPlan } from "@/lib/plans";
import { programmeNameToSlug } from "@/lib/programme";
import { activeAccessFilter } from "@/lib/plan-validity";

export type AccessInfo = {
  userId: string | null;
  isAuthed: boolean;
  isAdmin: boolean;
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
  isAdmin: false,
  planSlugs: new Set(),
  programmeSlugs: new Set(),
  examKeys: new Set(),
  examPlanOwned: false,
  ownedYearScopes: new Set(),
  ownedSubjectIds: new Set(),
};

const ALL_PROGRAMME_SLUGS = new Set(PLANS.filter((p) => p.type === "COURSE" && p.programmeSlug).map((p) => p.programmeSlug!));
const ALL_EXAM_KEYS = new Set(["psc", "icar-entrance", "net", "ars"]);
const ALL_PLAN_SLUGS = new Set(PLANS.map((p) => p.slug));
const ALL_YEAR_SCOPES = new Set(
  ["ahdp", "bvsc"].flatMap((prog) => ["I Year", "II Year", "III Year", "IV Year", "V Year"].map((y) => `${prog}:${y}`))
);

// Returns the plans the current user has PAID for, derived from Payment rows.
// Only non-expired payments grant access (expiresAt null = lifetime,
// which includes all purchases up to the 24.09.2026 lifetime cutoff).
// Used to gate premium content (syllabus, previous-year papers, mock tests).
// Cached per request so multiple gating checks (page + attempt API + subject
// lookups) inside a single render/share don't each hit the DB.
async function accessFromPayments(userId: string): Promise<AccessInfo> {
  const { prisma } = await import("@/lib/prisma");
  const payments = await prisma.payment.findMany({
    where: { userId, status: "PAID", planSlug: { not: null }, ...activeAccessFilter() },
    include: { plan: true },
  });

  const info: AccessInfo = {
    userId,
    isAuthed: true,
    isAdmin: false,
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

function fullAdminAccess(userId: string): AccessInfo {
  return {
    userId,
    isAuthed: true,
    isAdmin: true,
    planSlugs: ALL_PLAN_SLUGS,
    programmeSlugs: ALL_PROGRAMME_SLUGS,
    examKeys: ALL_EXAM_KEYS,
    examPlanOwned: true,
    ownedYearScopes: ALL_YEAR_SCOPES,
    ownedSubjectIds: new Set(),
  };
}

export const getAccess = cache(async (): Promise<AccessInfo> => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const role = session?.user?.role;
  if (!userId) return EMPTY;

  // Admin gets full access to all content — no payment required
  if (role === "ADMIN") return fullAdminAccess(userId);

  return accessFromPayments(userId);
});

// Token-based (mobile app / Bearer) callers have a verified userId but no
// NextAuth session. Role is re-read from the DB on every call — never trust
// the client — and banned users get EMPTY so a ban takes effect immediately
// even for previously issued mobile tokens.
export async function getAccessForUser(userId: string): Promise<AccessInfo> {
  if (!userId) return EMPTY;
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, banned: true },
  });
  if (!user || user.banned) return EMPTY;
  if (user.role === "ADMIN") return fullAdminAccess(userId);
  return accessFromPayments(userId);
}

// Returns whether the current user may take a given mock/adaptive/PYQ test.
// Mirrors the gating used by the /mock-tests/[id] and /papers/[id] pages so
// the attempt-save API cannot be bypassed by calling it directly.
async function mockTestAllowed(
  access: AccessInfo,
  test: {
    subjectId?: string | null;
    exam?: string | null;
    isDemo?: boolean;
  }
): Promise<boolean> {
  // Demo tests are free for everyone (no purchase required).
  if (test.isDemo) return true;

  if (!access.isAuthed) return false;

  if (test.exam) {
    // "other" is a catch-all exam category — open to any signed-in member.
    if (test.exam === "other") return access.isAuthed;
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

  // Free general test (no programme, no exam): open to everyone. Anonymous
  // users are still blocked from saving attempts by the 401 check in the
  // attempt API, but the test player itself is publicly viewable.
  return true;
}

export async function canAccessMockTest(test: {
  subjectId?: string | null;
  exam?: string | null;
  isDemo?: boolean;
}): Promise<boolean> {
  return mockTestAllowed(await getAccess(), test);
}

// Same gating for mobile (Bearer-token) callers that have no NextAuth session.
export async function canAccessMockTestForUser(
  userId: string,
  test: {
    subjectId?: string | null;
    exam?: string | null;
    isDemo?: boolean;
  }
): Promise<boolean> {
  return mockTestAllowed(await getAccessForUser(userId), test);
}
