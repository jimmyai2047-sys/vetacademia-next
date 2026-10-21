// Shared scope helpers for plan creation/updates (finding 10 + 11):
//  - validate programme/exam refs against the canonical reference dictionary
//  - detect duplicate scope rows (same programme/exam + year/subject + validity)
//    before they reach the storefront, where they'd make purchase links ambiguous.

import type { PlanType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isProgrammeSlug, isExamSlug } from "@/lib/reference-dictionary";

export type PlanScopeInput = {
  type: PlanType;
  programmeSlug?: string | null;
  examSlug?: string | null;
  year?: string | null;
  subjectId?: string | null;
  validityDays: number | null;
};

export function validateScopeRefs(input: {
  type: string;
  programmeSlug?: string | null;
  examSlug?: string | null;
}): string | null {
  if (input.programmeSlug && !isProgrammeSlug(input.programmeSlug)) {
    return `Unknown programme slug "${input.programmeSlug}" — use ahdp, dvp, bvsc, mvsc or phd`;
  }
  if (input.examSlug && !isExamSlug(input.examSlug)) {
    return `Unknown exam slug "${input.examSlug}" — pick a value from the reference dictionary`;
  }
  return null;
}

export async function findDuplicateScope(
  scope: PlanScopeInput,
  excludeSlug?: string
): Promise<{ slug: string; name: string } | null> {
  return prisma.plan.findFirst({
    where: {
      type: scope.type,
      programmeSlug: scope.programmeSlug ?? null,
      examSlug: scope.examSlug ?? null,
      year: scope.year ?? null,
      subjectId: scope.subjectId ?? null,
      validityDays: scope.validityDays,
      ...(excludeSlug ? { slug: { not: excludeSlug } } : {}),
    },
    select: { slug: true, name: true },
  });
}
