const subjectImages: Record<string, string> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // AHDP Subjects
  // ═══════════════════════════════════════════════════════════════════════════
  "Introductory Veterinary Anatomy": "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=80",
  "Introductory Veterinary Physiology & Biochemistry": "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&q=80",
  "Introductory Animal Management": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=80",
  "Animal Husbandry Extension": "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80",
  "Introductory Animal Genetics": "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=800&q=80",
  "Introductory Veterinary Pharmacology": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80",
  "Introductory Veterinary Clinical Medicine": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
  "Minor Veterinary Surgery": "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80",
  "Introductory Animal Reproduction": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
  "Introductory Animal Nutrition": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",

  // ═══════════════════════════════════════════════════════════════════════════
  // BVSc / MVSc / PhD Shared Subjects (same names used across programmes)
  // ═══════════════════════════════════════════════════════════════════════════
  "Veterinary Anatomy": "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=80",
  "Veterinary Physiology": "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&q=80",
  "Livestock Production Management": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=80",
  "Veterinary Biochemistry": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
  "Veterinary Pathology": "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80",
  "Veterinary Microbiology": "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80",
  "Animal Genetics and Breeding": "https://images.unsplash.com/photo-1648792940059-3b782a7b8b20?w=800&q=80",
  "Animal Nutrition": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
  "Veterinary Parasitology": "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&q=80",
  "Veterinary Pharmacology and Toxicology": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80",
  "Veterinary Public Health and Epidemiology": "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80",
  "Livestock Products Technology": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  "Veterinary and Animal Husbandry Extension Education": "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80",
  "Veterinary Surgery and Radiology": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
  "Veterinary Gynaecology and Obstetrics": "https://images.unsplash.com/photo-1506110061263-1de62e5aad6a?w=800&q=80",
  "Veterinary Clinical Practices": "https://images.unsplash.com/photo-1733783506192-653df6185a7d?w=800&q=80",
  "Livestock Farm Practices": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=80",
  "Veterinary Medicine": "https://images.unsplash.com/photo-1725409796872-8b41e8eca929?w=800&q=80",
  "Preventive Medicine": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",

  // ═══════════════════════════════════════════════════════════════════════════
  // MVSc/PhD Unique Subjects
  // ═══════════════════════════════════════════════════════════════════════════
  "Veterinary Biotechnology": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80",
  "Veterinary Extension Education": "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80",
  "Animal Reproduction Gynaecology and Obstetrics": "https://images.unsplash.com/photo-1506110061263-1de62e5aad6a?w=800&q=80",
  "Livestock Production and Management": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=80",
  "Poultry Science": "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80",
  "Common Courses": "https://images.unsplash.com/photo-1454179083322-198bb4daae41?w=800&q=80",
};

const programmeImages: Record<string, string> = {
  ahdp: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80",
  bvsc: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=1200&q=80",
  mvsc: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&q=80",
  phd: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=80",
};

export function getSubjectImage(name: string): string {
  return subjectImages[name] || "https://images.unsplash.com/photo-1454179083322-198bb4daae41?w=800&q=80";
}

export function getProgrammeImage(slug: string): string {
  return programmeImages[slug] || programmeImages.ahdp;
}

export default subjectImages;
