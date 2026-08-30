export type BookKind = "Text" | "Ref";
export type BookAccess = "open" | "ref";
export type AcademicLevel = "UG" | "PG" | "PhD";

export type LeveledBook = {
  t: string;
  a: string;
  kind: BookKind;
  s: BookAccess;
  url?: string;
};

export type LevelData = {
  books: LeveledBook[];
  journal?: string;
};

export type SubjectEntry = {
  subject: string;
  code: string;
  levels: Record<AcademicLevel, LevelData>;
};

// VetAcademia — Reading List by Subject & Academic Level
// Source: C:/Users/dell/Downloads/vetacademia-reading-list.html (provided)
// Organized as UG = B.V.Sc & A.H., PG = M.V.Sc, PhD
// Each book has kind (Textbook vs Reference Book) + access (Open vs Reference Only)
// findUrl: if open && url -> official site, else WorldCat

export const CATALOG_DATA: SubjectEntry[] = [
  {
    subject: "Veterinary Anatomy",
    code: "VA",
    levels: {
      UG: {
        books: [
          { t: "Textbook of Veterinary Anatomy", a: "Dyce, Sack & Wensing", kind: "Text", s: "ref" },
          { t: "Primary Veterinary Anatomy", a: "R.K. Ghosh", kind: "Text", s: "ref" },
        ],
      },
      PG: {
        books: [{ t: "Sisson and Grossman's The Anatomy of the Domestic Animals", a: "ed. Robert Getty", kind: "Text", s: "ref" }],
      },
      PhD: {
        books: [{ t: "Miller's Anatomy of the Dog", a: "Various (comparative/applied reference)", kind: "Ref", s: "ref" }],
        journal: "Anatomia, Histologia, Embryologia (journal)",
      },
    },
  },
  {
    subject: "Veterinary Physiology",
    code: "VP",
    levels: {
      UG: { books: [{ t: "Textbook of Veterinary Physiology", a: "William O. Reece / Cunningham (eds.)", kind: "Text", s: "ref" }] },
      PG: {
        books: [
          { t: "Dukes' Physiology of Domestic Animals", a: "ed. W.O. Reece", kind: "Text", s: "ref" },
          { t: "Reproduction in Farm Animals", a: "E.S.E. Hafez", kind: "Ref", s: "ref" },
        ],
      },
      PhD: { books: [], journal: "Domestic Animal Endocrinology; Journal of Animal Science" },
    },
  },
  {
    subject: "Veterinary Biochemistry",
    code: "BIO",
    levels: {
      UG: {
        books: [
          { t: "Biochemistry", a: "U. Satyanarayana & U. Chakrapani", kind: "Text", s: "ref" },
          { t: "Harper's Illustrated Biochemistry", a: "Rodwell et al.", kind: "Ref", s: "ref" },
        ],
      },
      PG: { books: [{ t: "Clinical Biochemistry of Domestic Animals", a: "Kaneko, Harvey & Bruss", kind: "Text", s: "ref" }] },
      PhD: {
        books: [{ t: "Clinical Biochemistry of Domestic Animals (advanced sections)", a: "Kaneko, Harvey & Bruss", kind: "Ref", s: "ref" }],
        journal: "Molecular/metabolic research literature",
      },
    },
  },
  {
    subject: "Veterinary Microbiology",
    code: "VM",
    levels: {
      UG: {
        books: [
          { t: "Veterinary Microbiology and Microbial Disease", a: "Quinn, Markey, Carter, Donnelly & Leonard", kind: "Text", s: "ref" },
          { t: "Ananthanarayan and Paniker's Textbook of Microbiology", a: "Ananthanarayan & Paniker", kind: "Ref", s: "ref" },
        ],
      },
      PG: { books: [{ t: "Topley & Wilson's Microbiology and Microbial Infections", a: "Various (eds.)", kind: "Text", s: "ref" }] },
      PhD: {
        books: [{ t: "Fenner's Veterinary Virology", a: "MacLachlan & Dubovi", kind: "Text", s: "ref" }],
        journal: "Veterinary Microbiology (journal)",
      },
    },
  },
  {
    subject: "Veterinary Pathology",
    code: "PAT",
    levels: {
      UG: {
        books: [
          { t: "A Textbook of Veterinary General Pathology", a: "J.L. Vegad", kind: "Text", s: "ref" },
          { t: "Pathologic Basis of Veterinary Disease", a: "James F. Zachary & M. Donald McGavin", kind: "Ref", s: "ref" },
        ],
      },
      PG: { books: [{ t: "Jubb, Kennedy and Palmer's Pathology of Domestic Animals", a: "eds. Grant Maxie", kind: "Text", s: "ref" }] },
      PhD: {
        books: [{ t: "Jubb, Kennedy and Palmer's Pathology of Domestic Animals (full set, advanced)", a: "eds. Grant Maxie", kind: "Ref", s: "ref" }],
        journal: "Veterinary Pathology (journal)",
      },
    },
  },
  {
    subject: "Animal Genetics and Breeding",
    code: "AGB",
    levels: {
      UG: { books: [{ t: "A Text Book on Animal Genetics", a: "P. Kanakaraj", kind: "Text", s: "ref" }] },
      PG: { books: [{ t: "Introduction to Quantitative Genetics", a: "Douglas Falconer & Trudy Mackay", kind: "Text", s: "ref" }] },
      PhD: {
        books: [{ t: "Genetics of Populations", a: "Philip Hedrick", kind: "Text", s: "ref" }],
        journal: "Journal of Animal Breeding and Genetics",
      },
    },
  },
  {
    subject: "Animal Nutrition",
    code: "NUT",
    levels: {
      UG: {
        books: [
          { t: "Principles of Animal Nutrition and Feed Technology", a: "D.V. Reddy", kind: "Text", s: "ref" },
          { t: "Animal Nutrition", a: "McDonald, Edwards, Greenhalgh & Morgan", kind: "Ref", s: "ref" },
        ],
      },
      PG: {
        books: [
          { t: "Nutrient Requirements of Dairy Cattle", a: "National Research Council (NRC), USA", kind: "Text", s: "ref" },
          { t: "Animal Nutrition (advanced chapters)", a: "McDonald, Edwards, Greenhalgh & Morgan", kind: "Ref", s: "ref" },
        ],
      },
      PhD: {
        books: [{ t: "Quantitative Aspects of Ruminant Digestion and Metabolism", a: "J.M. Forbes & J. France (eds.)", kind: "Text", s: "ref" }],
        journal: "Journal of Dairy Science",
      },
    },
  },
  {
    subject: "Veterinary Parasitology",
    code: "PARA",
    levels: {
      UG: {
        books: [
          { t: "Veterinary Parasitology at a Glance", a: "S.C. Mandal", kind: "Text", s: "ref" },
          { t: "Textbook of Veterinary Parasitology", a: "Bhatia, Pathak & Juyal", kind: "Ref", s: "ref" },
        ],
      },
      PG: { books: [{ t: "Veterinary Parasitology", a: "M.A. Taylor, R.L. Coop & R.L. Wall", kind: "Text", s: "ref" }] },
      PhD: {
        books: [{ t: "Parasitology for Veterinarians", a: "J.R. Georgi", kind: "Text", s: "ref" }],
        journal: "Veterinary Parasitology (journal)",
      },
    },
  },
  {
    subject: "Veterinary Pharmacology and Toxicology",
    code: "PHARM",
    levels: {
      UG: {
        books: [
          { t: "Essentials of Veterinary Pharmacology and Therapeutics", a: "Harpal Singh Sandhu", kind: "Text", s: "ref" },
          { t: "Essentials of Medical Pharmacology", a: "K.D. Tripathi", kind: "Ref", s: "ref" },
        ],
      },
      PG: { books: [{ t: "Veterinary Pharmacology and Therapeutics", a: "Jim E. Riviere & Mark G. Papich (eds.)", kind: "Text", s: "ref" }] },
      PhD: {
        books: [{ t: "Casarett & Doull's Toxicology: The Basic Science of Poisons", a: "eds. Klaassen", kind: "Text", s: "ref" }],
        journal: "Journal of Veterinary Pharmacology and Therapeutics",
      },
    },
  },
  {
    subject: "Veterinary Public Health and Epidemiology",
    code: "VPH",
    levels: {
      UG: {
        books: [
          { t: "Veterinary Public Health and Epidemiology", a: "Krishna Gopal Narayan", kind: "Text", s: "ref" },
          { t: "Elements of Veterinary Public Health", a: "ICAR", kind: "Ref", s: "open", url: "https://icar.org.in/" },
        ],
      },
      PG: { books: [{ t: "Veterinary Epidemiology", a: "Michael Thrusfield", kind: "Text", s: "ref" }] },
      PhD: {
        books: [{ t: "Modern Infectious Disease Epidemiology", a: "Johan Giesecke", kind: "Text", s: "ref" }],
        journal: "Preventive Veterinary Medicine (journal)",
      },
    },
  },
  {
    subject: "Vet. & Animal Husbandry Extension Education",
    code: "EXT",
    levels: {
      UG: { books: [{ t: "Textbook of Animal Husbandry and Livestock Extension", a: "P. Mathialagan", kind: "Text", s: "ref" }] },
      PG: {
        books: [
          { t: "Diffusion of Innovations", a: "Everett M. Rogers", kind: "Text", s: "ref" },
          { t: "Extension Education", a: "G.L. Ray", kind: "Ref", s: "ref" },
        ],
      },
      PhD: { books: [], journal: "Extension research-methodology texts; Indian Research Journal of Extension Education" },
    },
  },
  {
    subject: "Livestock Production Management",
    code: "LPM",
    levels: {
      UG: {
        books: [
          { t: "Livestock Production Management", a: "N.S.R. Sastry & C.K. Thomas", kind: "Text", s: "ref" },
          { t: "Farm Animal Management", a: "Rana Ranjeet Singh & Md Manzarul Islam", kind: "Ref", s: "ref" },
        ],
      },
      PG: { books: [{ t: "Handbook of Good Dairy Husbandry Practices", a: "NDDB", kind: "Ref", s: "open", url: "https://www.nddb.coop/" }] },
      PhD: { books: [], journal: "Livestock Science; Journal of Dairy Science — precision livestock farming literature" },
    },
  },
  {
    subject: "Livestock Products Technology",
    code: "LPT",
    levels: {
      UG: {
        books: [
          { t: "Meat & Meat Products Technology, Including Poultry Products Technology", a: "B.D. Sharma", kind: "Text", s: "ref" },
          { t: "Outlines of Dairy Technology", a: "Sukumar De", kind: "Ref", s: "ref" },
        ],
      },
      PG: {
        books: [
          { t: "Lawrie's Meat Science", a: "eds. Fidel Toldrá", kind: "Text", s: "ref" },
          { t: "Modern Dairy Technology", a: "R.K. Robinson (ed.)", kind: "Ref", s: "ref" },
        ],
      },
      PhD: { books: [], journal: "Meat Science; International Dairy Journal" },
    },
  },
  {
    subject: "Veterinary Medicine",
    code: "MED",
    levels: {
      UG: {
        books: [
          { t: "Textbook of Clinical Veterinary Medicine", a: "Amalendu Chakrabarti", kind: "Text", s: "ref" },
          { t: "Clinical Veterinary Medicine", a: "A.U. Bhikane", kind: "Ref", s: "ref" },
        ],
      },
      PG: {
        books: [
          { t: "Large Animal Internal Medicine", a: "Bradford P. Smith (ed.)", kind: "Text", s: "ref" },
          { t: "The Merck/MSD Veterinary Manual", a: "Merck & Co. / MSD", kind: "Ref", s: "open", url: "https://www.msdvetmanual.com/" },
        ],
      },
      PhD: {
        books: [{ t: "Textbook of Veterinary Internal Medicine", a: "Ettinger & Feldman (eds.)", kind: "Text", s: "ref" }],
        journal: "Journal of Veterinary Internal Medicine",
      },
    },
  },
  {
    subject: "Veterinary Surgery and Radiology",
    code: "SURG",
    levels: {
      UG: { books: [{ t: "A Textbook on Veterinary Surgery and Radiology", a: "Samit Kumar Nandi, Samar Halder & Mozammel Hoque", kind: "Text", s: "ref" }] },
      PG: {
        books: [
          { t: "Textbook of Small Animal Surgery", a: "Douglas Slatter (ed.)", kind: "Text", s: "ref" },
          { t: "Farm Animal Surgery", a: "Susan L. Fubini & Norm G. Ducharme", kind: "Ref", s: "ref" },
        ],
      },
      PhD: {
        books: [{ t: "Equine Surgery", a: "Jörg A. Auer & John A. Stick (eds.)", kind: "Text", s: "ref" }],
        journal: "Veterinary Surgery (journal)",
      },
    },
  },
  {
    subject: "Veterinary Gynaecology and Obstetrics",
    code: "GYN",
    levels: {
      UG: { books: [{ t: "Applied Veterinary Gynaecology and Obstetrics", a: "Pradeep Kumar", kind: "Text", s: "ref" }] },
      PG: { books: [{ t: "Arthur's Veterinary Reproduction and Obstetrics", a: "D.E. Noakes, T.J. Parkinson & G.C.W. England", kind: "Text", s: "ref" }] },
      PhD: {
        books: [{ t: "Reproduction in Farm Animals", a: "E.S.E. Hafez & B. Hafez (eds.)", kind: "Text", s: "ref" }],
        journal: "Theriogenology (journal)",
      },
    },
  },
];

export const LEVELS: AcademicLevel[] = ["UG", "PG", "PhD"];
export const LEVEL_LABEL: Record<AcademicLevel, string> = {
  UG: "B.V.Sc & A.H. (UG)",
  PG: "M.V.Sc (PG)",
  PhD: "Ph.D.",
};
