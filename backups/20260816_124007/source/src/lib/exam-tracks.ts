// Granular content tracks for the admin Content Management page.
//
// A "track" is a precise content bucket. Several tracks may share the same
// broad `exam` key (e.g. VO/VS and LSA are both PSC; ICAR Pre and ICAR Mains
// are both ARS/NET), but in the admin UI they are managed separately.
//
// `tag` is the value stored in Post.track / MockTest.track.
// `exam` is the broad exam key used for public exam pages.

export type TrackOption = {
  value: string;
  label: string;
  exam: string | null;
};

// Selectable options for the admin forms (Previous Year Papers + Mock Tests).
export const TRACK_OPTIONS: TrackOption[] = [
  { value: "", label: "None (general)", exam: null },
  { value: "veterinary-officer", label: "VO/VS (PSC)", exam: "psc" },
  { value: "livestock-assistant", label: "LSA (PSC)", exam: "psc" },
  { value: "icar-jrf-srf", label: "ICAR-JRF/SRF", exam: "icar-entrance" },
  { value: "icar-pre", label: "ICAR Pre (ARS/NET)", exam: "ars" },
  { value: "icar-mains", label: "ICAR Mains (ARS/NET)", exam: "ars" },
  { value: "icar-net", label: "ICAR-NET", exam: "net" },
];

export function examForTrack(track?: string | null): string | null {
  return TRACK_OPTIONS.find((o) => o.value === track)?.exam || null;
}

export function trackLabel(track?: string | null): string {
  if (!track) return "General";
  return TRACK_OPTIONS.find((o) => o.value === track)?.label || track;
}

// Top-level cards on the Content Management page. A track may have one or more
// sub-tracks (rendered as separate sections on the per-exam page).
export type ExamSubTrack = { tag: string; label: string };
export type ExamTrack = {
  key: string; // route segment: /admin/content/exam/[key]
  label: string;
  subs: ExamSubTrack[];
};

export const EXAM_CONTENT_TRACKS: ExamTrack[] = [
  {
    key: "veterinary-officer",
    label: "Veterinary Officer / V.S. (VO/VS)",
    subs: [{ tag: "veterinary-officer", label: "VO/VS" }],
  },
  {
    key: "livestock-assistant",
    label: "Livestock Assistant (LSA)",
    subs: [{ tag: "livestock-assistant", label: "LSA" }],
  },
  {
    key: "icar-jrf-srf",
    label: "ICAR-JRF/SRF",
    subs: [{ tag: "icar-jrf-srf", label: "JRF/SRF" }],
  },
  {
    key: "icar-ars-net",
    label: "ICAR-ARS / NET",
    subs: [
      { tag: "icar-pre", label: "ICAR Pre" },
      { tag: "icar-mains", label: "ICAR Mains" },
    ],
  },
  {
    key: "icar-net",
    label: "ICAR-NET",
    subs: [{ tag: "icar-net", label: "NET" }],
  },
];

export function getExamTrack(key: string) {
  return EXAM_CONTENT_TRACKS.find((t) => t.key === key);
}
