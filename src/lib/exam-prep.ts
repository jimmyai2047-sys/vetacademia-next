// Examination preparation categories and study-material types.
//
// A "prep category" groups the granular content tracks so students can find
// everything (study materials, previous year papers, mock & adaptive tests)
// for one exam in one place.

export type MaterialType = "PPT" | "PDF" | "VIDEO" | "AUDIO" | "ANIMATION" | "IMAGE";

export const MATERIAL_TYPES: { value: MaterialType; label: string }[] = [
  { value: "PPT", label: "PPT" },
  { value: "PDF", label: "PDF" },
  { value: "VIDEO", label: "Video" },
  { value: "AUDIO", label: "Audio" },
  { value: "ANIMATION", label: "Animation" },
  { value: "IMAGE", label: "Image" },
];

export type ExamPrepCategory = {
  key: "VO" | "LSA" | "ARS" | "ICAR_ENTRANCE";
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
};

export function categoryForExamContentTrack(key: string) {
  return EXAM_CONTENT_TRACK_TO_CATEGORY[key] || null;
}

// Material types that are typically an uploaded file vs. an external link.
export const FILE_TYPES: MaterialType[] = ["PPT", "PDF", "ANIMATION", "IMAGE"];
export const LINK_TYPES: MaterialType[] = ["VIDEO", "AUDIO"];

export function materialTypeLabel(type: string) {
  return MATERIAL_TYPES.find((t) => t.value === type)?.label || type;
}
