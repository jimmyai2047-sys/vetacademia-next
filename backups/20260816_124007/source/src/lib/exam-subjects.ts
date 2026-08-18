export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type Discipline = {
  slug: string;
  name: string;
  subjectName?: string; // DB subject name used to link existing content
  programmeSlug?: string; // bvsc | ahdp | mvsc — programme that owns the subject
  isGeneral?: boolean; // General Knowledge style paper (no subject)
};

export type Group = {
  slug: string;
  name: string;
  planSlug?: string; // which plan gates this group (e.g. PSC tracks)
  programmeSlug?: string; // if set, disciplines = all subjects of this programme
  disciplines?: Discipline[]; // static disciplines
  extraDisciplines?: Discipline[]; // e.g. General Knowledge
};

export type ExamStructure = {
  groups?: Group[];
  disciplines?: Discipline[];
};

const GK: Discipline = {
  slug: "general-knowledge",
  name: "General Knowledge",
  isGeneral: true,
};

// Canonical discipline definitions (slug, display name, linked subject).
const D = {
  anatomy: { slug: "anatomy", name: "Veterinary Anatomy", subjectName: "Veterinary Anatomy", programmeSlug: "mvsc" },
  physiology: { slug: "physiology", name: "Veterinary Physiology", subjectName: "Veterinary Physiology", programmeSlug: "mvsc" },
  animalNutrition: { slug: "animal-nutrition", name: "Animal Nutrition", subjectName: "Animal Nutrition", programmeSlug: "mvsc" },
  agb: { slug: "animal-genetics-breeding", name: "Animal Genetics & Breeding", subjectName: "Animal Genetics and Breeding", programmeSlug: "mvsc" },
  biochemistry: { slug: "biochemistry", name: "Veterinary Biochemistry", subjectName: "Veterinary Biochemistry", programmeSlug: "mvsc" },
  microbiology: { slug: "microbiology", name: "Veterinary Microbiology", subjectName: "Veterinary Microbiology", programmeSlug: "mvsc" },
  pathology: { slug: "pathology", name: "Veterinary Pathology", subjectName: "Veterinary Pathology", programmeSlug: "mvsc" },
  parasitology: { slug: "parasitology", name: "Veterinary Parasitology", subjectName: "Veterinary Parasitology", programmeSlug: "mvsc" },
  pharmacology: { slug: "pharmacology", name: "Veterinary Pharmacology & Toxicology", subjectName: "Veterinary Pharmacology and Toxicology", programmeSlug: "mvsc" },
  publicHealth: { slug: "public-health", name: "Veterinary Public Health & Epidemiology", subjectName: "Veterinary Public Health and Epidemiology", programmeSlug: "mvsc" },
  surgery: { slug: "surgery", name: "Veterinary Surgery & Radiology", subjectName: "Veterinary Surgery and Radiology", programmeSlug: "mvsc" },
  medicine: { slug: "medicine", name: "Veterinary Medicine", subjectName: "Veterinary Medicine", programmeSlug: "mvsc" },
  gynaecology: { slug: "gynaecology", name: "Veterinary Gynaecology & Obstetrics", subjectName: "Animal Reproduction Gynaecology and Obstetrics", programmeSlug: "mvsc" },
  biotechnology: { slug: "biotechnology", name: "Veterinary Biotechnology", subjectName: "Veterinary Biotechnology", programmeSlug: "mvsc" },
  lpm: { slug: "lpm", name: "Livestock Production & Management", subjectName: "Livestock Production and Management", programmeSlug: "mvsc" },
  lpt: { slug: "lpt", name: "Livestock Products Technology", subjectName: "Livestock Products Technology", programmeSlug: "mvsc" },
  extension: { slug: "extension", name: "Veterinary Extension Education", subjectName: "Veterinary Extension Education", programmeSlug: "mvsc" },
  poultry: { slug: "poultry", name: "Poultry Science", subjectName: "Poultry Science", programmeSlug: "mvsc" },
} satisfies Record<string, Discipline>;

const ALL_DISCIPLINES: Discipline[] = Object.values(D);

// ARS and NET are organized per M.V.Sc discipline.
const ARS_NET_DISCIPLINES: Discipline[] = Object.values(D);

// ICAR-JRF (PG entrance) is organized by 4 groups, each with its subjects.
const ICAR_JRF_GROUPS: Group[] = [
  {
    slug: "veterinary-science",
    name: "Veterinary Science",
    disciplines: [
      D.gynaecology,
      D.surgery,
      D.medicine,
      D.microbiology,
      D.pathology,
      D.parasitology,
      D.pharmacology,
      D.anatomy,
      D.publicHealth,
      D.biotechnology,
    ],
  },
  {
    slug: "animal-science",
    name: "Animal Science",
    disciplines: [
      D.physiology,
      D.lpm,
      D.lpt,
      D.animalNutrition,
      D.agb,
    ],
  },
  {
    slug: "biochemistry",
    name: "Biochemistry",
    disciplines: [D.biochemistry],
  },
  {
    slug: "social-science",
    name: "Social Science",
    disciplines: [D.extension],
  },
];

// PSC tracks: Veterinary Officer (B.V.Sc subjects) and Livestock Assistant (AHDP subjects),
// each with a General Knowledge paper.
const PSC_GROUPS: Group[] = [
  {
    slug: "veterinary-officer",
    name: "Veterinary Officer / Surgeon",
    planSlug: "veterinary-officer",
    programmeSlug: "bvsc",
    extraDisciplines: [GK],
  },
  {
    slug: "livestock-assistant",
    name: "Livestock Assistant",
    planSlug: "livestock-assistant",
    programmeSlug: "ahdp",
    extraDisciplines: [GK],
  },
];

export const EXAM_STRUCTURE: Record<string, ExamStructure> = {
  "icar-entrance": { groups: ICAR_JRF_GROUPS },
  net: { disciplines: ARS_NET_DISCIPLINES },
  ars: { disciplines: ARS_NET_DISCIPLINES },
  psc: { groups: PSC_GROUPS },
};

export function getExamGroups(exam: string): Group[] {
  return EXAM_STRUCTURE[exam]?.groups ?? [];
}

export function getExamDisciplines(exam: string): Discipline[] {
  const s = EXAM_STRUCTURE[exam];
  if (s?.groups) return s.groups.flatMap((g) => g.disciplines ?? []);
  return s?.disciplines ?? [];
}

export function findDiscipline(
  exam: string,
  slug: string
): { discipline: Discipline; group?: Group } | null {
  const s = EXAM_STRUCTURE[exam];
  if (!s) return null;
  if (s.groups) {
    for (const g of s.groups) {
      const all = [...(g.disciplines ?? []), ...(g.extraDisciplines ?? [])];
      const d = all.find((x) => x.slug === slug);
      if (d) return { discipline: d, group: g };
    }
    return null;
  }
  const d = s.disciplines?.find((x) => x.slug === slug);
  return d ? { discipline: d } : null;
}

export { ALL_DISCIPLINES, GK };
