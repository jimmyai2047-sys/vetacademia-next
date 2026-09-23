// ─────────────────────────────────────────────────────────────────────────────
// State-wise paravet job preparation — the JOB side of the diploma basket.
//
// Each state runs its own diploma (see src/lib/diplomas.ts) and recruits for
// its own post with its own board + its own state-GK paper:
//
//   Rajasthan → LSA (RSSB + Rajasthan GK)  |  Haryana → VLDA (HSSC + Haryana GK)
//   MP → AVFO (MP-ESB + MP GK)  |  UP → Pharmacist (UPSSSC + UP GK)  |  …
//
// Preparation strategy per state (no backend change needed):
//   1. COMMON CORE (80%) — the live AHDP syllabus + LSA track materials,
//      mocks & PYQs shared by every state.
//   2. STATE GK (20%) — the state's General Knowledge paper + post-specific
//      pattern (added per state as content is authored).
//
// Used by: /examinations/paravet-jobs hub, /diplomas cards, navbar Exams
// dropdown, /prepare LSA state banner, PSC exam page state grid.
// ─────────────────────────────────────────────────────────────────────────────

export type StateJob = {
  slug: string; // URL anchor, e.g. "rajasthan"
  state: string; // e.g. "Rajasthan"
  stateCode: string; // e.g. "RJ"
  diplomaSlug: string; // link into src/lib/diplomas.ts
  diplomaShort: string; // e.g. "AHDP"
  course: string; // e.g. "AHDP (Animal Husbandry Diploma Programme)"
  authority: string; // e.g. "RAJUVAS Bikaner"
  post: string; // e.g. "Livestock Assistant (LSA) / Pashudhan Sahayak"
  postShort: string; // e.g. "LSA"
  recruitingBody: string; // e.g. "RSSB"
  gkPaper: string; // e.g. "Rajasthan GK"
  note?: string; // verified recruitment detail (posts, pay, eligibility, council)
  prepHref?: string; // dedicated prepare tab, e.g. "/prepare?tab=UP_PHARMACIST&state=uttar-pradesh"
};

export const STATE_JOBS: StateJob[] = [
  {
    slug: "rajasthan",
    state: "Rajasthan",
    stateCode: "RJ",
    diplomaSlug: "ahdp",
    diplomaShort: "AHDP",
    course: "AHDP (Animal Husbandry Diploma Programme)",
    authority: "RAJUVAS Bikaner",
    post: "Livestock Assistant (LSA) / Pashudhan Sahayak",
    postShort: "LSA",
    recruitingBody: "RSSB",
    gkPaper: "Rajasthan GK",
  },
  {
    slug: "haryana",
    state: "Haryana",
    stateCode: "HR",
    diplomaSlug: "vldd",
    diplomaShort: "VLDD",
    course: "VLDD (Veterinary & Livestock Development Diploma)",
    authority: "LUVAS Hisar",
    post: "Veterinary & Livestock Development Assistant (VLDA)",
    postShort: "VLDA",
    recruitingBody: "HSSC",
    gkPaper: "Haryana GK",
  },
  {
    slug: "madhya-pradesh",
    state: "Madhya Pradesh",
    stateCode: "MP",
    diplomaSlug: "dah",
    diplomaShort: "DAH",
    course: "DAH (Diploma in Animal Husbandry)",
    authority: "NDVSU Jabalpur",
    post: "Assistant Veterinary Field Officer (AVFO)",
    postShort: "AVFO",
    recruitingBody: "MP-ESB",
    gkPaper: "MP GK",
  },
  {
    slug: "uttar-pradesh",
    state: "Uttar Pradesh",
    stateCode: "UP",
    diplomaSlug: "dvp",
    diplomaShort: "DVP",
    course: "DVP (Diploma in Veterinary Pharmacy)",
    authority: "DUVASU Mathura",
    post: "Veterinary Pharmacist / Livestock Extension Officer",
    postShort: "Pharmacist",
    recruitingBody: "UPSSSC",
    gkPaper: "UP GK",
    note: "UPSSSC recruits Veterinary Pharmacists for the Animal Husbandry Dept.; DVP (DUVASU Mathura) is the qualifying diploma. Posts and pattern as per the latest UPSSSC advertisement.",
    prepHref: "/prepare?tab=UP_PHARMACIST&state=uttar-pradesh",
  },
  {
    slug: "punjab",
    state: "Punjab",
    stateCode: "PB",
    diplomaSlug: "dvsaht",
    diplomaShort: "DVSAHT",
    course: "Diploma in Veterinary Science and Animal Health Technology",
    authority: "GADVASU Ludhiana",
    post: "Veterinary Inspector (Directorate of Animal Husbandry, Punjab)",
    postShort: "Vet. Inspector",
    recruitingBody: "PSSSB",
    gkPaper: "Punjab GK",
    note: "PSSSB recruits Veterinary Inspectors — 310 posts (2026, revised), 644 (2023). Eligibility: 10+2 + Diploma in Veterinary Science & Animal Health Technology.",
  },
  {
    slug: "himachal-pradesh",
    state: "Himachal Pradesh",
    stateCode: "HP",
    diplomaSlug: "dvph",
    diplomaShort: "DVP (HP)",
    course: "Diploma in Veterinary Pharmacist",
    authority: "CSKHPKV Palampur & Abhilashi University Mandi",
    post: "Veterinary Pharmacist (Animal Husbandry Dept., HP)",
    postShort: "Pharmacist",
    recruitingBody: "HPRCA (ex-HPSSC)",
    gkPaper: "HP GK",
    note: "188 posts via HPSSC (2022); 12 posts (2025). Needs HP Para Veterinary Council registration + CSKHPKV-pattern 2-yr training.",
  },
  {
    slug: "uttarakhand",
    state: "Uttarakhand",
    stateCode: "UK",
    diplomaSlug: "dvple",
    diplomaShort: "DVPLE",
    course: "DVPLE (Diploma in Veterinary Pharmacy and Livestock Extension)",
    authority: "GBPUAT Pantnagar",
    post: "Veterinary Pharmacy Officer / Pashudhan Prasar Adhikari (LEO)",
    postShort: "Pharmacy Officer",
    recruitingBody: "AHD UK + UKSSSC",
    gkPaper: "Uttarakhand GK",
    note: "2026: 28 Veterinary Pharmacy Officer posts, Level-6 (₹35,400–1,12,400), merit on diploma marks. Plus Pashudhan Prasar Adhikari via UKSSSC.",
  },
  {
    slug: "jammu-kashmir",
    state: "Jammu & Kashmir",
    stateCode: "JK",
    diplomaSlug: "stock-jk",
    diplomaShort: "Stock Asst.",
    course: "Diploma in Veterinary Pharmacy / Stock Assistant Training Course",
    authority: "SKUAST Jammu & SKUAST Kashmir",
    post: "Stock Assistant / Veterinary Pharmacist (Sheep & Animal Husbandry Depts.)",
    postShort: "Stock Asst.",
    recruitingBody: "JKSSB",
    gkPaper: "J&K GK",
    note: "JKSSB advertises BOTH posts — Stock Assistant (Item Nos. 641–688 series) and Veterinary Pharmacist (Item Nos. 610–615, division/district cadre).",
  },
  {
    slug: "bihar",
    state: "Bihar",
    stateCode: "BR",
    diplomaSlug: "dvld",
    diplomaShort: "DVLD",
    course: "DVLD (Diploma in Veterinary & Livestock Development)",
    authority: "BASU Patna",
    post: "Veterinary Field Assistant (VFA) / Para-Vet Worker",
    postShort: "VFA",
    recruitingBody: "BSSC",
    gkPaper: "Bihar GK",
  },
];

export const STATE_JOB_BY_SLUG: Record<string, StateJob> = Object.fromEntries(
  STATE_JOBS.map((j) => [j.slug, j])
);

export function getStateJob(slug: string | null | undefined): StateJob | null {
  if (!slug) return null;
  const key = slug.toLowerCase();
  return (
    STATE_JOB_BY_SLUG[key] ??
    STATE_JOBS.find((j) => j.stateCode.toLowerCase() === key) ??
    null
  );
}
