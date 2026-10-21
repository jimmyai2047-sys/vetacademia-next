import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Single source of truth for the public expert count: published Expert
// consultant profiles — exactly the rows listed on /experts. Homepage stats,
// the vets page badge and marketing copy all read this so the numbers can
// never disagree with the directory again.
export const getPublishedExpertCount = unstable_cache(
  async (): Promise<number> => {
    try {
      return await prisma.expert.count();
    } catch {
      return 0;
    }
  },
  ["published-expert-count"],
  { revalidate: 300 }
);

// Human label for the count. Zero (or a failed lookup) renders a non-numeric
// claim instead of inventing a number — every surface then reads consistently
// as e.g. "10 Experts" / "Verified Experts".
export function expertCountLabel(count: number): string {
  return count > 0 ? String(count) : "Verified";
}

// Short note reused where counts are shown, so verification and review
// sources are always explained next to the claim.
export const EXPERT_COUNT_SOURCE_NOTE =
  "Count = published consultant profiles on /experts. Each profile is verified by our team (designation, qualifications & posting) before going live; star ratings come only from completed consultations booked on VetAcademia.";
