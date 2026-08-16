import { prisma } from "@/lib/prisma";
import { getExamKeysForPlan } from "@/lib/plans";
import { roleGroup } from "@/lib/roles";
export {
  PROGRAMME_REFS,
  EXAM_REFS,
  ROLE_REFS,
} from "./community-constants";

export type CommunityLinkRow = {
  id: string;
  platform: string;
  category: string;
  ref: string;
  title: string;
  url: string;
};

// Resolve which community (WhatsApp/Telegram) links a user is eligible for:
//  - PROGRAMME / EXAM links require a PAID enrolment (incl. year/subject plans)
//  - ROLE links are shown to any logged-in user with that signup role
export async function getEligibleCommunityLinks(
  userId: string
): Promise<CommunityLinkRow[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const payments = await prisma.payment.findMany({
    where: { userId, status: "PAID" },
    include: { plan: true },
  });

  const programmeSlugs = new Set<string>();
  const examKeys = new Set<string>();
  for (const p of payments) {
    const plan = p.plan;
    if (!plan) continue;
    if (plan.type === "COURSE" && plan.programmeSlug) {
      programmeSlugs.add(plan.programmeSlug);
    }
    if (plan.type === "EXAM" && plan.examSlug) {
      getExamKeysForPlan(plan.examSlug).forEach((k) => examKeys.add(k));
    }
  }

  const links = await prisma.communityLink.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { ref: "asc" }],
  });

  return links
    .filter(
      (l) =>
        (l.category === "PROGRAMME" && programmeSlugs.has(l.ref)) ||
        (l.category === "EXAM" && examKeys.has(l.ref)) ||
        (l.category === "ROLE" && !!user && l.ref === roleGroup(user.role))
    )
    .map((l) => ({
      id: l.id,
      platform: l.platform,
      category: l.category,
      ref: l.ref,
      title: l.title,
      url: l.url,
    }));
}

