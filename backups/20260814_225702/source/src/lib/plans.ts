export type PlanType = "COURSE" | "EXAM";

export type PlanDef = {
  slug: string;
  name: string;
  type: PlanType;
  description: string;
  defaultPrice: number;
  programmeSlug?: string; // for COURSE plans
  examSlug?: string; // for EXAM plans
  sortOrder: number;
};

// Canonical plan catalog. Prices/descriptions are editable in the DB (Plan model)
// and referenced by `slug`. This constant is the source of truth for access mapping.
export const PLANS: PlanDef[] = [
  {
    slug: "ahdp",
    name: "A.H.D.P. (Animal Husbandry Diploma)",
    type: "COURSE",
    description:
      "Complete Animal Husbandry Diploma Programme syllabus, chapters and study material.",
    defaultPrice: 999,
    programmeSlug: "ahdp",
    sortOrder: 1,
  },
  {
    slug: "bvsc",
    name: "B.V.Sc & A.H.",
    type: "COURSE",
    description:
      "Full Bachelor of Veterinary Science & Animal Husbandry curriculum (MSVE-2016).",
    defaultPrice: 2999,
    programmeSlug: "bvsc",
    sortOrder: 2,
  },
  {
    slug: "mvsc",
    name: "M.V.Sc",
    type: "COURSE",
    description:
      "Postgraduate specializations across 18 departments with departmental structure.",
    defaultPrice: 3999,
    programmeSlug: "mvsc",
    sortOrder: 3,
  },
  {
    slug: "phd",
    name: "Ph.D (Veterinary Science)",
    type: "COURSE",
    description:
      "Doctoral research programme in veterinary science specializations.",
    defaultPrice: 4999,
    programmeSlug: "phd",
    sortOrder: 4,
  },
  {
    slug: "veterinary-officer",
    name: "Veterinary Officer (PSC)",
    type: "EXAM",
    description:
      "Complete preparation for State & Central PSC Veterinary Officer / Surgeon exams.",
    defaultPrice: 1499,
    examSlug: "veterinary-officer",
    sortOrder: 5,
  },
  {
    slug: "livestock-assistant",
    name: "Livestock Assistant (PSC)",
    type: "EXAM",
    description:
      "Targeted preparation for PSC Livestock Assistant recruitment examinations.",
    defaultPrice: 999,
    examSlug: "livestock-assistant",
    sortOrder: 6,
  },
  {
    slug: "icar-jrf-srf",
    name: "ICAR-JRF/SRF",
    type: "EXAM",
    description:
      "Comprehensive ICAR-JRF and ICAR-SRF entrance examination preparation.",
    defaultPrice: 1999,
    examSlug: "icar-jrf-srf",
    sortOrder: 7,
  },
  {
    slug: "net",
    name: "NET (ICAR/CSIR/UGC)",
    type: "EXAM",
    description:
      "Preparation for NET (ICAR / CSIR / UGC) lectureship and JRF eligibility.",
    defaultPrice: 1499,
    examSlug: "net",
    sortOrder: 8,
  },
  {
    slug: "ars",
    name: "ARS (ASRB)",
    type: "EXAM",
    description:
      "Targeted preparation for the ARS (Agricultural Research Scientist) examination.",
    defaultPrice: 1999,
    examSlug: "ars",
    sortOrder: 9,
  },
];

export const PLAN_BY_SLUG: Record<string, PlanDef> = Object.fromEntries(
  PLANS.map((p) => [p.slug, p])
);

// Maps an EXAM plan (examSlug) to the previous-year-paper content keys it unlocks.
// Content keys match the `exam` field on Previous Year Paper posts and the
// `[exam]` route param on /examinations.
export function getExamKeysForPlan(examSlug?: string): string[] {
  switch (examSlug) {
    case "veterinary-officer":
    case "livestock-assistant":
      return ["psc"];
    case "icar-jrf-srf":
      return ["icar-entrance"];
    case "net":
      return ["net"];
    case "ars":
      return ["ars"];
    default:
      return [];
  }
}

// Primary plan slug to surface as the "enroll" CTA for a given exam content key.
export function planSlugForExam(examKey: string): string | null {
  switch (examKey) {
    case "psc":
      return "veterinary-officer";
    case "icar-entrance":
      return "icar-jrf-srf";
    case "net":
      return "net";
    case "ars":
      return "ars";
    default:
      return null;
  }
}
