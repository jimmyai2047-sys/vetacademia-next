// Shared mapping between Programme.name (DB) and the URL slug used by
// /syllabus/[programme] routes (ahdp | bvsc | mvsc | phd).
//
// The DB stores programme names like "BVSC" / "B.V.Sc & A.H." while routes
// expect lowercase slugs, so centralize both directions here.

export const SLUG_TO_PROGRAMME_NAME: Record<string, string> = {
  ahdp: "A.H.D.P.",
  dvp: "DVP",
  bvsc: "B.V.Sc & A.H.",
  mvsc: "M.V.Sc",
  phd: "Ph.D.",
};

const PROGRAMME_NAME_TO_SLUG: Record<string, string> = {
  AHDP: "ahdp",
  "A.H.D.P.": "ahdp",
  "A.H.D.P": "ahdp",
  // DVP (Uttar Pradesh) now has its own live programme + syllabus.
  // Other diploma-basket tracks reuse the AHDP core until authored.
  DVP: "dvp",
  DVPH: "ahdp",
  "DVP (HP)": "ahdp",
  DLE: "ahdp",
  VLDD: "ahdp",
  DAH: "ahdp",
  DVPLE: "ahdp",
  DVSAHT: "ahdp",
  DVLD: "ahdp",
  DVLT: "ahdp",
  "STOCK ASST.": "ahdp",
  "STOCK ASSISTANT": "ahdp",
  BVSC: "bvsc",
  "B.V.Sc & A.H.": "bvsc",
  "B.V.Sc & A.H": "bvsc",
  "B.V.Sc": "bvsc",
  MVSC: "mvsc",
  "M.V.Sc": "mvsc",
  PHD: "phd",
  "Ph.D": "phd",
};

export function slugToProgrammeName(slug: string): string {
  return SLUG_TO_PROGRAMME_NAME[slug] ?? slug;
}

export function programmeNameToSlug(name: string): string {
  if (PROGRAMME_NAME_TO_SLUG[name]) return PROGRAMME_NAME_TO_SLUG[name];
  const lower = name.toLowerCase();
  // Diploma-basket aliases (except live DVP) resolve to the AHDP core.
  // NOTE: exact "DVP" is mapped above; "dvp" substring still catches
  // variants like "DVP (HP)" / "DVPH" which share the core.
  if (["dvp", "dvph", "dle", "vldd", "dah", "dvple", "dvsaht", "dvld", "dvlt", "stock"].some((k) => lower.includes(k)))
    return "ahdp";
  if (lower.includes("ahdp")) return "ahdp";
  if (lower.includes("b.v.sc")) return "bvsc";
  if (lower.includes("m.v.sc")) return "mvsc";
  if (lower.includes("ph.d")) return "phd";
  return lower;
}
