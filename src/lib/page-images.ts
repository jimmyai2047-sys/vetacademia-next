// Unique HQ images for non-syllabus plates (exams, exam-prep, farm types, heroes).
// Each image is distinct — no reuse across categories.

const examImages: Record<string, string> = {
  psc: "https://images.unsplash.com/photo-1569858241634-5aee6e47091a?w=1200&q=80",
  "psc-vo": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&q=80",
  "psc-lsa": "https://images.unsplash.com/photo-1657536011755-b6cbe9c4c522?w=1200&q=80",
  "icar-entrance": "https://images.unsplash.com/photo-1648792940059-3b782a7b8b20?w=1200&q=80",
  "icar-jrf": "https://images.unsplash.com/photo-1464983953574-0892a716854b?w=1200&q=80",
  "icar-srf": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&q=80",
  net: "https://images.unsplash.com/photo-1517697382483-dfc60dfb913f?w=1200&q=80",
  "net-icar": "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=1200&q=80",
  "net-csir": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80",
  "net-ugc": "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1200&q=80",
  ars: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80",
  other: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=1200&q=80",
};

const examPrepImages: Record<string, string> = {
  VO: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&q=80",
  LSA: "https://images.unsplash.com/photo-1657536011755-b6cbe9c4c522?w=1200&q=80",
  ARS: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80",
  ICAR_ENTRANCE: "https://images.unsplash.com/photo-1648792940059-3b782a7b8b20?w=1200&q=80",
  NET: "https://images.unsplash.com/photo-1517697382483-dfc60dfb913f?w=1200&q=80",
};

const farmTypeImages: Record<string, string> = {
  SCIENTIFIC: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=1200&q=80",
  DAIRY: "https://images.unsplash.com/photo-1573731281021-d1cc573b3310?w=1200&q=80",
  GOAT: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80",
  SHEEP: "https://images.unsplash.com/photo-1598618717478-81c4a532ea50?w=1200&q=80",
  POULTRY: "https://images.unsplash.com/photo-1676984030996-b71929f90924?w=1200&q=80",
  PIG: "https://images.unsplash.com/photo-1569858241634-5aee6e47091a?w=1200&q=80",
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
