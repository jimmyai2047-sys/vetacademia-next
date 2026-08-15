// Content-management tracks shown on the admin Content Management page.
// Each track maps to one or more exam keys used by Posts (PREVIOUS_YEAR) and
// Mock Tests (exam field).
export const EXAM_CONTENT_TRACKS = [
  {
    key: "veterinary-officer",
    label: "Veterinary Officer / V.S. (VO/VS)",
    examKeys: ["psc"],
  },
  {
    key: "livestock-assistant",
    label: "Livestock Assistant (LSA)",
    examKeys: ["psc"],
  },
  {
    key: "icar-jrf-srf",
    label: "ICAR-JRF/SRF",
    examKeys: ["icar-entrance"],
  },
  {
    key: "icar-ars-net",
    label: "ICAR-ARS / NET",
    examKeys: ["ars", "net"],
  },
];

export function getExamTrack(key: string) {
  return EXAM_CONTENT_TRACKS.find((t) => t.key === key);
}
