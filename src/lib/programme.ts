// Shared mapping between Programme.name (DB) and the URL slug used by
// /syllabus/[programme] routes (ahdp | bvsc | mvsc | phd).
//
// The DB stores programme names like "BVSC" / "B.V.Sc & A.H." while routes
// expect lowercase slugs, so centralize both directions here.

export const SLUG_TO_PROGRAMME_NAME: Record<string, string> = {
  ahdp: "AHDP",
  bvsc: "BVSC",
  mvsc: "MVSC",
  phd: "PHD",
};

const PROGRAMME_NAME_TO_SLUG: Record<string, string> = {
  AHDP: "ahdp",
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
  if (lower.includes("ahdp")) return "ahdp";
  if (lower.includes("b.v.sc")) return "bvsc";
  if (lower.includes("m.v.sc")) return "mvsc";
  if (lower.includes("ph.d")) return "phd";
  return lower;
}
