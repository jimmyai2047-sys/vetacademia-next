// ─────────────────────────────────────────────────────────────────────────────
// Diploma basket — single source of truth for every Diploma-level track.
//
// KEY INSIGHT: the same "paravet" level has a DIFFERENT name in each state,
// run by a DIFFERENT university, leading to a DIFFERENT government post:
//   Rajasthan AHDP (RAJUVAS) → LSA  |  Haryana VLDD (LUVAS) → VLDA  |
//   MP DAH (NDVSU) → AVFO  |  UP DVP (DUVASU) → Pharmacist  |  …
// (see STATE_JOBS in src/lib/state-jobs.ts for the job-prep side).
//
// Only AHDP has full syllabus content today (/syllabus/ahdp). All other tracks
// reuse the AHDP core (subjects overlap ~80%) and are marked "coming-soon"
// until their specialization modules are authored.
//
// Add a new state diploma here (and its job in state-jobs.ts) and it
// automatically appears in:
//  • Navbar → Student Corner dropdown (Diploma group, state-tagged)
//  • Home → Our Programme (Diploma hub card)
//  • /diplomas hub page (state-wise cards)
//  • /examinations/paravet-jobs hub page (state job cards)
//  • /syllabus/[programme] fallback banner
// ─────────────────────────────────────────────────────────────────────────────

export type DiplomaStatus = "live" | "coming-soon";

export type DiplomaTrack = {
  slug: string; // URL key, e.g. "ahdp" | "dvp" | "dvlt"
  short: string; // badge label, e.g. "AHDP"
  fullName: string;
  // ── State mapping ──
  state: string; // e.g. "Rajasthan" (or "Multi-state" for DVLT)
  stateCode: string; // e.g. "RJ"
  authority: string; // governing university/body, e.g. "RAJUVAS Bikaner"
  jobPost: string; // primary govt job role, e.g. "Livestock Assistant (LSA)"
  jobShort: string; // e.g. "LSA"
  recruitingBody: string; // e.g. "RSSB"
  jobNote?: string; // verified recruitment detail (posts, pay, eligibility, council)
  // ── Study info ──
  duration: string;
  eligibility: string;
  focus: string[];
  careers: string[];
  examLink: string; // state anchor on the paravet-jobs hub, e.g. "/examinations/paravet-jobs#rajasthan"
  examLabel: string; // e.g. "LSA • RSSB"
  status: DiplomaStatus;
  syllabusHref: string;
  badge?: string; // small highlight, e.g. "Most Popular" | "New"
};

export const DIPLOMA_UMBRELLA = {
  title: "Diploma in Veterinary & Animal Husbandry",
  short: "Diploma Programmes",
  description:
    "Same paravet level, different name in each state — 9 state-recognized diploma tracks for paravets, pharmacists, extension workers and lab technicians. One common science core (AHDP syllabus) + state GK for the job exam.",
  href: "/diplomas",
} as const;

export const DIPLOMA_TRACKS: DiplomaTrack[] = [
  {
    slug: "ahdp",
    short: "AHDP",
    fullName: "Animal Husbandry Diploma Programme",
    state: "Rajasthan",
    stateCode: "RJ",
    authority: "RAJUVAS Bikaner",
    jobPost: "Livestock Assistant (LSA) / Pashudhan Sahayak",
    jobShort: "LSA",
    recruitingBody: "RSSB",
    duration: "2 Years",
    eligibility: "10+2 (PCB / Agriculture)",
    focus: ["Animal management", "Nutrition", "Reproduction", "Medicine & surgery basics", "Extension"],
    careers: ["Livestock Assistant (LSA)", "Pashudhan Sahayak", "Dairy / Goat farm supervisor"],
    examLink: "/examinations/paravet-jobs#rajasthan",
    examLabel: "LSA • RSSB",
    status: "live",
    syllabusHref: "/syllabus/ahdp",
    badge: "Admissions Open",
  },
  {
    slug: "vldd",
    short: "VLDD",
    fullName: "Veterinary & Livestock Development Diploma",
    state: "Haryana",
    stateCode: "HR",
    authority: "LUVAS Hisar",
    jobPost: "Veterinary & Livestock Development Assistant (VLDA)",
    jobShort: "VLDA",
    recruitingBody: "HSSC",
    duration: "2 Years",
    eligibility: "10+2 (PCB)",
    focus: ["Livestock development schemes", "Breeding & AI basics", "Extension & camps"],
    careers: ["VLDA", "Livestock development assistant", "NGO / Govt. field staff"],
    examLink: "/examinations/paravet-jobs#haryana",
    examLabel: "VLDA • HSSC",
    status: "coming-soon",
    syllabusHref: "/syllabus/ahdp",
  },
  {
    slug: "dah",
    short: "DAH",
    fullName: "Diploma in Animal Husbandry",
    state: "Madhya Pradesh",
    stateCode: "MP",
    authority: "NDVSU Jabalpur",
    jobPost: "Assistant Veterinary Field Officer (AVFO)",
    jobShort: "AVFO",
    recruitingBody: "MPPEB / ESB",
    duration: "2 Years",
    eligibility: "10+2 (Science)",
    focus: ["Livestock production", "Feeding & housing", "Health & first-aid", "Farm records"],
    careers: ["AVFO", "Veterinary field staff", "Farm manager"],
    examLink: "/examinations/paravet-jobs#madhya-pradesh",
    examLabel: "AVFO • MP-ESB",
    status: "coming-soon",
    syllabusHref: "/syllabus/ahdp",
    badge: "Same core as AHDP",
  },
  {
    slug: "dvp",
    short: "DVP",
    fullName: "Diploma in Veterinary Pharmacy",
    state: "Uttar Pradesh",
    stateCode: "UP",
    authority: "DUVASU Mathura",
    jobPost: "Veterinary Pharmacist / Livestock Extension Officer",
    jobShort: "Pharmacist",
    recruitingBody: "UPSSSC",
    jobNote: "UPSSSC recruits Veterinary Pharmacists for the Animal Husbandry Dept.; DVP (DUVASU Mathura) is the qualifying diploma.",
    duration: "2 Years",
    eligibility: "10+2 (PCB)",
    focus: ["Pharmacology", "Drug dispensing & dosage", "Cold-chain & storage", "Prescription reading"],
    careers: ["Veterinary pharmacist", "Livestock Extension Officer", "Dispensary assistant"],
    examLink: "/examinations/up-pharmacist",
    examLabel: "Pharmacist • UPSSSC",
    status: "live",
    syllabusHref: "/syllabus/dvp",
    badge: "Syllabus live",
  },
  {
    slug: "dvsaht",
    short: "DVSAHT",
    fullName: "Diploma in Veterinary Science and Animal Health Technology",
    state: "Punjab",
    stateCode: "PB",
    authority: "GADVASU Ludhiana",
    jobPost: "Veterinary Inspector (Directorate of Animal Husbandry, Punjab)",
    jobShort: "Vet. Inspector",
    recruitingBody: "PSSSB",
    jobNote: "PSSSB recruits Veterinary Inspectors — 310 posts (2026, revised), 644 (2023). Eligibility: 10+2 + Diploma in Veterinary Science & Animal Health Technology.",
    duration: "2 Years",
    eligibility: "10+2 (PCB) + DVSAHT diploma",
    focus: ["Animal health technology", "Diagnostics assistance", "OT & clinic support"],
    careers: ["Veterinary Inspector (Punjab Govt.)", "Para-vet field worker", "Vet hospital assistant"],
    examLink: "/examinations/paravet-jobs#punjab",
    examLabel: "Vet. Inspector • PSSSB",
    status: "coming-soon",
    syllabusHref: "/syllabus/ahdp",
  },
  {
    slug: "dvph",
    short: "DVP (HP)",
    fullName: "Diploma in Veterinary Pharmacist",
    state: "Himachal Pradesh",
    stateCode: "HP",
    authority: "CSKHPKV Palampur & Abhilashi University Mandi",
    jobPost: "Veterinary Pharmacist (Animal Husbandry Dept., HP)",
    jobShort: "Pharmacist",
    recruitingBody: "HPRCA (ex-HPSSC)",
    jobNote: "188 Veterinary Pharmacist posts via HPSSC (2022); 12 posts (2025). Needs HP Para Veterinary Council registration + CSKHPKV-pattern 2-yr training.",
    duration: "2 Years",
    eligibility: "10+2 (PCB)",
    focus: ["Pharmacology", "Drug dispensing", "Hilly-area field practice"],
    careers: ["Veterinary pharmacist (HP Govt.)", "Dispensary assistant"],
    examLink: "/examinations/paravet-jobs#himachal-pradesh",
    examLabel: "Pharmacist • HPRCA",
    status: "coming-soon",
    syllabusHref: "/syllabus/ahdp",
  },
  {
    slug: "dvple",
    short: "DVPLE",
    fullName: "Diploma in Veterinary Pharmacy and Livestock Extension",
    state: "Uttarakhand",
    stateCode: "UK",
    authority: "GBPUAT Pantnagar",
    jobPost: "Veterinary Pharmacy Officer / Pashudhan Prasar Adhikari (LEO)",
    jobShort: "Pharmacy Officer",
    recruitingBody: "AHD UK + UKSSSC",
    jobNote: "2026: 28 Veterinary Pharmacy Officer posts, Pay Level-6 (₹35,400–1,12,400), merit on diploma marks. Plus Pashudhan Prasar Adhikari via UKSSSC (May 2026 advt.).",
    duration: "2 Years",
    eligibility: "10+2 (PCB)",
    focus: ["Pharmacy + extension combined", "Drug + field practice"],
    careers: ["Veterinary Pharmacy Officer (UK Govt.)", "Pashudhan Prasar Adhikari", "Livestock extension worker"],
    examLink: "/examinations/paravet-jobs#uttarakhand",
    examLabel: "Pharmacy Officer • Level-6",
    status: "coming-soon",
    syllabusHref: "/syllabus/ahdp",
  },
  {
    slug: "stock-jk",
    short: "Stock Asst.",
    fullName: "Diploma in Veterinary Pharmacy / Stock Assistant Training Course",
    state: "Jammu & Kashmir",
    stateCode: "JK",
    authority: "SKUAST Jammu & SKUAST Kashmir",
    jobPost: "Stock Assistant / Veterinary Pharmacist (Sheep & Animal Husbandry Depts.)",
    jobShort: "Stock Asst.",
    recruitingBody: "JKSSB",
    jobNote: "JKSSB advertises BOTH posts — Stock Assistant (Item Nos. 641–688 series) and Veterinary Pharmacist (Item Nos. 610–615, division/district cadre).",
    duration: "2 Years",
    eligibility: "10+2 (PCB)",
    focus: ["Pharmacy basics", "Stock & store management", "Field assistance"],
    careers: ["Stock assistant", "Veterinary pharmacist"],
    examLink: "/examinations/paravet-jobs#jammu-kashmir",
    examLabel: "Stock Asst. • JKSSB",
    status: "coming-soon",
    syllabusHref: "/syllabus/ahdp",
  },
  {
    slug: "dvld",
    short: "DVLD",
    fullName: "Diploma in Veterinary & Livestock Development",
    state: "Bihar",
    stateCode: "BR",
    authority: "BASU Patna",
    jobPost: "Veterinary Field Assistant (VFA) / Para-Vet Worker",
    jobShort: "VFA",
    recruitingBody: "BSSC",
    duration: "2 Years",
    eligibility: "10+2 (Science)",
    focus: ["Veterinary basics", "Livestock development", "Field extension"],
    careers: ["Veterinary Field Assistant (VFA)", "Para-vet worker"],
    examLink: "/examinations/paravet-jobs#bihar",
    examLabel: "VFA • BSSC",
    status: "coming-soon",
    syllabusHref: "/syllabus/ahdp",
  },
  {
    slug: "dvlt",
    short: "DVLT",
    fullName: "Diploma in Veterinary Laboratory Technology",
    state: "Multi-state",
    stateCode: "IN",
    authority: "Various state universities",
    jobPost: "Veterinary Lab Technician (state recruitments)",
    jobShort: "Lab Tech",
    recruitingBody: "State SSBs",
    duration: "2 Years",
    eligibility: "10+2 (PCB)",
    focus: ["Sample collection", "Hematology & microscopy", "Culture & sensitivity basics", "Lab QA"],
    careers: ["Vet lab technician", "Diagnostic lab assistant", "Disease-surveillance staff"],
    examLink: "/examinations/other",
    examLabel: "Lab-technician recruitments",
    status: "coming-soon",
    syllabusHref: "/syllabus/ahdp",
    badge: "New",
  },
];

export const DIPLOMA_BY_SLUG: Record<string, DiplomaTrack> = Object.fromEntries(
  DIPLOMA_TRACKS.map((d) => [d.slug, d])
);

export const DIPLOMA_SLUGS = DIPLOMA_TRACKS.map((d) => d.slug);

export function getDiploma(slug: string | null | undefined): DiplomaTrack | null {
  if (!slug) return null;
  return DIPLOMA_BY_SLUG[slug.toLowerCase()] ?? null;
}

/** True when this syllabus slug is a diploma track that reuses AHDP content. */
export function isDiplomaSlug(slug: string): boolean {
  return slug.toLowerCase() !== "ahdp" && slug.toLowerCase() in DIPLOMA_BY_SLUG;
}
