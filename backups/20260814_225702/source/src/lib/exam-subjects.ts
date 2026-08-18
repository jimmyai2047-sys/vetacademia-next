export type Discipline = {
  slug: string;
  name: string;
  mvscSubject: string; // exact M.V.Sc subject name used to link existing content
};

export type Group = {
  slug: string;
  name: string;
  disciplines: Discipline[];
};

// Canonical discipline definitions (slug, display name, linked M.V.Sc subject).
const D = {
  anatomy: { slug: "anatomy", name: "Veterinary Anatomy", mvscSubject: "Veterinary Anatomy" },
  physiology: { slug: "physiology", name: "Veterinary Physiology", mvscSubject: "Veterinary Physiology" },
  animalNutrition: { slug: "animal-nutrition", name: "Animal Nutrition", mvscSubject: "Animal Nutrition" },
  agb: { slug: "animal-genetics-breeding", name: "Animal Genetics & Breeding", mvscSubject: "Animal Genetics and Breeding" },
  biochemistry: { slug: "biochemistry", name: "Veterinary Biochemistry", mvscSubject: "Veterinary Biochemistry" },
  microbiology: { slug: "microbiology", name: "Veterinary Microbiology", mvscSubject: "Veterinary Microbiology" },
  pathology: { slug: "pathology", name: "Veterinary Pathology", mvscSubject: "Veterinary Pathology" },
  parasitology: { slug: "parasitology", name: "Veterinary Parasitology", mvscSubject: "Veterinary Parasitology" },
  pharmacology: { slug: "pharmacology", name: "Veterinary Pharmacology & Toxicology", mvscSubject: "Veterinary Pharmacology and Toxicology" },
  publicHealth: { slug: "public-health", name: "Veterinary Public Health & Epidemiology", mvscSubject: "Veterinary Public Health and Epidemiology" },
  surgery: { slug: "surgery", name: "Veterinary Surgery & Radiology", mvscSubject: "Veterinary Surgery and Radiology" },
  medicine: { slug: "medicine", name: "Veterinary Medicine", mvscSubject: "Veterinary Medicine" },
  gynaecology: { slug: "gynaecology", name: "Veterinary Gynaecology & Obstetrics", mvscSubject: "Animal Reproduction Gynaecology and Obstetrics" },
  biotechnology: { slug: "biotechnology", name: "Veterinary Biotechnology", mvscSubject: "Veterinary Biotechnology" },
  lpm: { slug: "lpm", name: "Livestock Production & Management", mvscSubject: "Livestock Production and Management" },
  lpt: { slug: "lpt", name: "Livestock Products Technology", mvscSubject: "Livestock Products Technology" },
  extension: { slug: "extension", name: "Veterinary Extension Education", mvscSubject: "Veterinary Extension Education" },
  poultry: { slug: "poultry", name: "Poultry Science", mvscSubject: "Poultry Science" },
} satisfies Record<string, Discipline>;

const ALL_DISCIPLINES: Discipline[] = Object.values(D);

// ARS and NET are organized per M.V.Sc discipline.
const ARS_NET_DISCIPLINES: Discipline[] = [
  D.anatomy,
  D.physiology,
  D.animalNutrition,
  D.agb,
  D.biochemistry,
  D.microbiology,
  D.pathology,
  D.parasitology,
  D.pharmacology,
  D.publicHealth,
  D.surgery,
  D.medicine,
  D.gynaecology,
  D.biotechnology,
  D.lpm,
  D.lpt,
  D.extension,
  D.poultry,
];

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

export type ExamStructure = {
  groups?: Group[];
  disciplines?: Discipline[];
};

export const EXAM_STRUCTURE: Record<string, ExamStructure> = {
  "icar-entrance": { groups: ICAR_JRF_GROUPS },
  net: { disciplines: ARS_NET_DISCIPLINES },
  ars: { disciplines: ARS_NET_DISCIPLINES },
};

export function getExamGroups(exam: string): Group[] {
  return EXAM_STRUCTURE[exam]?.groups ?? [];
}

export function getExamDisciplines(exam: string): Discipline[] {
  const s = EXAM_STRUCTURE[exam];
  if (s?.groups) return s.groups.flatMap((g) => g.disciplines);
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
      const d = g.disciplines.find((x) => x.slug === slug);
      if (d) return { discipline: d, group: g };
    }
    return null;
  }
  const d = s.disciplines?.find((x) => x.slug === slug);
  return d ? { discipline: d } : null;
}

export { ALL_DISCIPLINES };
