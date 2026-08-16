// Suitable imagery for the non-syllabus "plates" (exams, exam-prep categories,
// farm guides, vet reference, pricing plans, expert/consultation heroes).
//
// These reuse the same Unsplash photo IDs already verified on the syllabus
// subject cards (src/lib/subject-images.ts) so the images are guaranteed to
// load. Add new keys here as more content sections are introduced.

const examImages: Record<string, string> = {
  psc: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80",
  "icar-entrance": "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=1200&q=80",
  net: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&q=80",
  ars: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=80",
  other: "https://images.unsplash.com/photo-1454179083322-198bb4daae41?w=1200&q=80",
};

const examPrepImages: Record<string, string> = {
  VO: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80",
  LSA: "https://images.unsplash.com/photo-1454179083322-198bb4daae41?w=1200&q=80",
  ARS: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=80",
  ICAR_ENTRANCE: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=1200&q=80",
  NET: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&q=80",
};

const farmTypeImages: Record<string, string> = {
  SCIENTIFIC: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80",
  DAIRY: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80",
  GOAT: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80",
  SHEEP: "https://images.unsplash.com/photo-1454179083322-198bb4daae41?w=1200&q=80",
  POULTRY: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=1200&q=80",
  PIG: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80",
};

const vetHeroImage =
  "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1600&q=80";
const expertHeroImage =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80";

export function getExamImage(id: string): string {
  return examImages[id] || examImages.other;
}

export function getExamPrepImage(key: string): string {
  return examPrepImages[key] || examImages.other;
}

export function getFarmTypeImage(key?: string | null): string {
  if (key && farmTypeImages[key]) return farmTypeImages[key];
  return farmTypeImages.SCIENTIFIC;
}

export function getVetHeroImage(): string {
  return vetHeroImage;
}

export function getExpertHeroImage(): string {
  return expertHeroImage;
}
