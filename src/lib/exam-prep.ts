// Examination preparation categories and study-material types.
//
// A "prep category" groups the granular content tracks so students can find
// everything (study materials, previous year papers, mock & adaptive tests)
// for one exam in one place.

export type MaterialType =
  | "PPT"
  | "PDF"
  | "DOC"
  | "XLS"
  | "VIDEO"
  | "AUDIO"
  | "ANIMATION"
  | "IMAGE";

export const MATERIAL_TYPES: { value: MaterialType; label: string }[] = [
  { value: "PPT", label: "PPT" },
  { value: "PDF", label: "PDF" },
  { value: "DOC", label: "Word" },
  { value: "XLS", label: "Excel" },
  { value: "VIDEO", label: "Video" },
  { value: "AUDIO", label: "Audio" },
  { value: "ANIMATION", label: "Animation" },
  { value: "IMAGE", label: "Image" },
];

export type ExamPrepCategory = {
  key: "VO" | "LSA" | "ARS" | "ICAR_ENTRANCE" | "NET";
  label: string;
  // granular content tracks that belong to this prep category
  tracks: string[];
  // broad exam key used for the public /examinations/[exam] page
  examKey: string;
};

export const EXAM_PREP_CATEGORIES: ExamPrepCategory[] = [
  {
    key: "VO",
    label: "Veterinary Officer (VO/VS)",
    tracks: ["veterinary-officer"],
    examKey: "psc",
  },
  {
    key: "LSA",
    label: "Livestock Assistant (LSA)",
    tracks: ["livestock-assistant"],
    examKey: "psc",
  },
  {
    key: "ARS",
    label: "ARS / NET",
    tracks: ["icar-pre", "icar-mains"],
    examKey: "ars",
  },
  {
    key: "ICAR_ENTRANCE",
    label: "ICAR Entrance (JRF/SRF)",
    tracks: ["icar-jrf-srf"],
    examKey: "icar-entrance",
  },
  {
    key: "NET",
    label: "ICAR-NET",
    tracks: ["icar-net"],
    examKey: "net",
  },
];

export function getExamPrepCategory(key: string) {
  return EXAM_PREP_CATEGORIES.find((c) => c.key === key);
}

// Map the admin "Content Management for Examination" track keys (route segments
// used on /admin/content/exam/[track]) to the ExamMaterial prep category, so
// study materials can be managed per exam from that page.
export const EXAM_CONTENT_TRACK_TO_CATEGORY: Record<string, string> = {
  "veterinary-officer": "VO",
  "livestock-assistant": "LSA",
  "icar-jrf-srf": "ICAR_ENTRANCE",
  "icar-ars-net": "ARS",
  "icar-net": "NET",
};

export function categoryForExamContentTrack(key: string) {
  return EXAM_CONTENT_TRACK_TO_CATEGORY[key] || null;
}

// Each prep category maps to an academic programme that supplies the Subject
// list, and a "level" that decides the second-level label
// (Chapter / Unit for UG, Course for PG).
export type Programme = "bvsc" | "ahdp" | "mvsc";

export const CATEGORY_TO_PROGRAMME: Record<string, Programme> = {
  VO: "bvsc",
  LSA: "ahdp",
  ICAR_ENTRANCE: "bvsc",
  ARS: "mvsc",
  NET: "mvsc",
};

export function programmeForCategory(category?: string | null): Programme | null {
  if (!category) return null;
  return CATEGORY_TO_PROGRAMME[category] || null;
}

export function levelForProgramme(programme?: Programme | null): "UG" | "PG" {
  return programme === "mvsc" ? "PG" : "UG";
}

// Study-material sections rendered on each per-exam Content Management page.
// A track may render more than one section (e.g. ICAR-JRF/SRF splits into a
// JRF section — B.V.Sc subjects — and an SRF section — M.V.Sc subjects).
export type MaterialSection = { label: string; category: string };

export const EXAM_CONTENT_MATERIAL_SECTIONS: Record<string, MaterialSection[]> = {
  "veterinary-officer": [
    { label: "Study Materials (B.V.Sc & A.H. Subjects)", category: "VO" },
  ],
  "livestock-assistant": [
    { label: "Study Materials (AHDP Subjects)", category: "LSA" },
  ],
  "icar-jrf-srf": [
    {
      label: "ICAR-JRF — B.V.Sc & A.H. Subjects (Chapter / Unit)",
      category: "ICAR_ENTRANCE",
    },
    {
      label: "ICAR-SRF — M.V.Sc Subjects (Course)",
      category: "ARS",
    },
  ],
  "icar-ars-net": [
    { label: "Study Materials (M.V.Sc Subjects / Course)", category: "ARS" },
  ],
  "icar-net": [
    { label: "Study Materials (M.V.Sc Subjects / Course)", category: "NET" },
  ],
};

export function materialSectionsForTrack(key: string): MaterialSection[] {
  return EXAM_CONTENT_MATERIAL_SECTIONS[key] || [];
}

// Material types that are typically an uploaded file vs. an external link.
export const FILE_TYPES: MaterialType[] = [
  "PPT",
  "PDF",
  "DOC",
  "XLS",
  "ANIMATION",
  "IMAGE",
];
export const LINK_TYPES: MaterialType[] = ["VIDEO", "AUDIO"];

export function materialTypeLabel(type: string) {
  return MATERIAL_TYPES.find((t) => t.value === type)?.label || type;
}
