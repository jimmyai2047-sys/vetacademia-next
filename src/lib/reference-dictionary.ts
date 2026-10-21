// Canonical programme / exam / role reference dictionary (finding 11 of the
// 20 Oct 2026 admin review).
//
// The same concepts used to be spelled differently in every module (community
// refs, plan slugs, PYQ tags, role names, admission options) — some missing
// DVP, some sharing one `psc` tag for VO and LSA. Everything below is the
// single vocabulary: modules should import from here instead of hardcoding
// option arrays, and admin write endpoints validate refs against this file.

import { SLUG_TO_PROGRAMME_NAME } from "@/lib/programme";
import { TRACK_OPTIONS } from "@/lib/exam-tracks";

export type RefOption = { value: string; label: string };

// ---------------------------------------------------------------------------
// Programmes (Plan.programmeSlug, CommunityLink ref when category=PROGRAMME,
// Book.level, Admission form, Content hub)
// ---------------------------------------------------------------------------

export const PROGRAMME_SLUGS = ["ahdp", "dvp", "bvsc", "mvsc", "phd"] as const;
export type ProgrammeSlug = (typeof PROGRAMME_SLUGS)[number];

export const PROGRAMME_REFS: RefOption[] = PROGRAMME_SLUGS.map((slug) => ({
  value: slug,
  label: SLUG_TO_PROGRAMME_NAME[slug] ?? slug,
}));

export function isProgrammeSlug(value: string): value is ProgrammeSlug {
  return (PROGRAMME_SLUGS as readonly string[]).includes(value);
}

// Display names accepted by the public admission form (zod enum).
export const ADMISSION_PROGRAMME_OPTIONS = [
  "AHDP",
  "DVP",
  "B.V.Sc & A.H.",
  "M.V.Sc",
  "Ph.D",
  "Other",
] as const;

// Admin Book/Blog level vocabulary (extends the legacy list with DVP).
export const BOOK_LEVELS = ["AHDP", "DVP", "BVSc", "MVSc", "PhD", "General"] as const;

// ---------------------------------------------------------------------------
// Exam keys (broad access-gating vocabulary: Post.exam, MockTest.exam,
// CommunityLink ref when category=EXAM, access.ts examKeys)
// ---------------------------------------------------------------------------

export const EXAM_KEY_REFS: RefOption[] = [
  { value: "psc", label: "PSC (VO/LSA)" },
  { value: "icar-entrance", label: "ICAR Entrance (JRF/SRF)" },
  { value: "net", label: "NET" },
  { value: "ars", label: "ARS" },
  { value: "up-pharmacist", label: "UP Pharmacist" },
  { value: "other", label: "Other / General" },
];

export const EXAM_KEYS: string[] = EXAM_KEY_REFS.map((r) => r.value);

// Legacy / alternate spellings → canonical key. Used by admin filters, the
// reference-check report, and labellers so raw tags never reach the UI.
export const EXAM_KEY_ALIASES: Record<string, string> = {
  "icar-jrf": "icar-entrance",
  "icar-srf": "icar-entrance",
  icar: "icar-entrance",
  "net-icar": "net",
  "net-csir": "net",
  "net-ugc": "net",
  vo: "psc",
  lsa: "psc",
  "veterinary-officer": "psc",
  "livestock-assistant": "psc",
};

export function canonicalExamKey(key?: string | null): string | null {
  if (!key) return null;
  return EXAM_KEY_ALIASES[key] ?? key;
}

export function examKeyLabel(key?: string | null): string {
  const c = canonicalExamKey(key);
  return EXAM_KEY_REFS.find((r) => r.value === c)?.label ?? (c ?? "—");
}

export function isValidExamKey(key?: string | null): boolean {
  const c = canonicalExamKey(key);
  return !!c && EXAM_KEYS.includes(c);
}

// Community exam refs. VO and LSA are now deliberately separate options; the
// shared legacy `psc` value stays valid so existing rows keep working.
export const COMMUNITY_EXAM_REFS: RefOption[] = [
  { value: "psc-vo", label: "PSC — Veterinary Officer" },
  { value: "psc-lsa", label: "PSC — Livestock Assistant" },
  { value: "psc", label: "PSC (shared VO/LSA — legacy)" },
  { value: "icar-entrance", label: "ICAR Entrance (JRF/SRF)" },
  { value: "net", label: "NET" },
  { value: "ars", label: "ARS" },
  { value: "up-pharmacist", label: "UP Pharmacist" },
  { value: "other", label: "Other Examinations" },
];

// Which broad exam keys satisfy a community exam ref (eligibility check in
// src/lib/community.ts). Unknown/legacy refs fall back to `[ref]` at the call
// site so behaviour for old rows never changes.
export const COMMUNITY_EXAM_REF_KEYS: Record<string, string[]> = {
  "psc-vo": ["psc"],
  "psc-lsa": ["psc"],
  psc: ["psc"],
  "icar-entrance": ["icar-entrance"],
  net: ["net"],
  ars: ["ars"],
  "up-pharmacist": ["up-pharmacist"],
  other: [],
};

// Exam plan slugs (Plan.examSlug) for the plan create/family forms.
export const EXAM_SLUG_REFS: RefOption[] = [
  { value: "veterinary-officer", label: "Veterinary Officer (PSC)" },
  { value: "livestock-assistant", label: "Livestock Assistant (PSC)" },
  { value: "up-pharmacist", label: "UP Pharmacist" },
  { value: "icar-jrf-srf", label: "ICAR JRF/SRF" },
  { value: "net", label: "NET" },
  { value: "ars", label: "ARS" },
];

export function isExamSlug(value: string): boolean {
  return EXAM_SLUG_REFS.some((r) => r.value === value);
}

// ---------------------------------------------------------------------------
// Content track tags (Post.track / MockTest.track) — canon lives in
// exam-tracks.ts; re-exported here so forms import one module.
// ---------------------------------------------------------------------------

export const TRACK_REFS: RefOption[] = TRACK_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export const TRACK_TAGS: string[] = TRACK_OPTIONS.map((o) => o.value);

// ---------------------------------------------------------------------------
// Role groups (CommunityLink ref when category=ROLE). Values must match
// roleGroup() output in src/lib/roles.ts.
// ---------------------------------------------------------------------------

export const ROLE_REFS: RefOption[] = [
  { value: "STUDENT", label: "Students" },
  { value: "ANIMAL_OWNER", label: "Animal Owners" },
  { value: "FACULTY", label: "Faculty" },
  { value: "ARS", label: "Agricultural Research Scientist" },
  { value: "FIELD_VET", label: "Field Veterinarian" },
];

export type RefCategory = "PROGRAMME" | "EXAM" | "ROLE";

export const CATEGORIES: RefOption[] = [
  { value: "PROGRAMME", label: "Programme" },
  { value: "EXAM", label: "Examination" },
  { value: "ROLE", label: "User Role" },
];

// Validate a CommunityLink ref against the dictionary for its category.
// Intentionally permissive for the legacy shared `psc` value (still listed in
// COMMUNITY_EXAM_REFS) — unknown refs are rejected on write only.
export function isValidCommunityRef(category: string, ref: string): boolean {
  switch (category) {
    case "PROGRAMME":
      return isProgrammeSlug(ref);
    case "EXAM":
      return COMMUNITY_EXAM_REFS.some((r) => r.value === ref);
    case "ROLE":
      return ROLE_REFS.some((r) => r.value === ref);
    default:
      return false;
  }
}
