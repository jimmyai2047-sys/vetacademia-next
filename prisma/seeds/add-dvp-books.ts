// Seed: recommended Books for DVP (level "DVP"), one row per DVP subject.
// Standard, real textbooks mapped to the 24 DVP (Uttar Pradesh) courses.
// Idempotent: scoped to level "DVP" only — rerunning wipes and recreates
// DVP book rows, nothing else.
//
// Run: npx tsx --env-file=.env prisma/seeds/add-dvp-books.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

type BookRow = {
  title: string;
  author?: string;
  publisher?: string;
  subject: string; // DVP subject name (matches Subject.name for filters)
  description: string;
};

const books: BookRow[] = [
  // ── Semester I ──
  {
    title: "Sisson and Grossman's The Anatomy of the Domestic Animals",
    author: "R. Getty",
    publisher: "Elsevier",
    subject: "Anatomy of Livestock and Poultry",
    description: "DVP-111 — standard reference for skeletal, digestive, respiratory, circulatory, urogenital and nervous systems with dissection guidance.",
  },
  {
    title: "A Textbook of Animal Husbandry",
    author: "G. C. Banerjee",
    publisher: "Oxford & IBH",
    subject: "Introduction to Livestock Management",
    description: "DVP-112 — housing, feeding, milking, calf rearing, health signs and poultry management for Indian farm conditions.",
  },
  {
    title: "A Textbook of Animal Husbandry",
    author: "G. C. Banerjee",
    publisher: "Oxford & IBH",
    subject: "Introduction to Livestock Breeds and Economic Traits",
    description: "DVP-113 — Indian and exotic breeds of cattle, buffalo, sheep, goat, pig and poultry with economic traits and selection pointers.",
  },
  {
    title: "Animal Nutrition",
    author: "P. McDonald, R. A. Edwards, J. F. D. Greenhalgh",
    publisher: "Pearson",
    subject: "Basics of Animal Nutrition and Health",
    description: "DVP-114 — nutrients, feedstuffs, ration principles, hay/silage and deficiency diseases.",
  },
  {
    title: "Dukes' Physiology of Domestic Animals",
    author: "W. O. Reece",
    publisher: "Wiley",
    subject: "Basics of Animal Physiology",
    description: "DVP-115 — digestion, blood, urinary and reproductive physiology with milk let-down and physiological norms.",
  },
  {
    title: "Veterinary Microbiology and Microbial Disease",
    author: "P. J. Quinn et al.",
    publisher: "Wiley-Blackwell",
    subject: "Elementary Microbiology",
    description: "DVP-116 — bacterial morphology, sterilization, disinfection, fungi, viruses and infection transmission.",
  },
  // ── Semester II ──
  {
    title: "Computer Fundamentals",
    author: "P. K. Sinha",
    publisher: "BPB Publications",
    subject: "Fundamentals of Computer and its Application",
    description: "DVP-121 — hardware, software, data entry and farm/epidemiology data handling for beginners.",
  },
  {
    title: "Veterinary Hematology and Clinical Chemistry",
    author: "M. A. Thrall et al.",
    publisher: "Wiley",
    subject: "Basics of Clinical Pathology",
    description: "DVP-122 — post-mortem technique, blood smears, CBC, urine examination and lesion-based diagnosis.",
  },
  {
    title: "Veterinary Parasitology",
    author: "M. Taylor, R. Coop, R. Wall",
    publisher: "Wiley-Blackwell",
    subject: "Elementary Parasitology",
    description: "DVP-123 — endo- and ecto-parasites, zoonotic parasites, faecal/blood/skin examination and control.",
  },
  {
    title: "Veterinary Pharmacology and Therapeutics",
    author: "J. E. Riviere, M. G. Papich",
    publisher: "Wiley",
    subject: "Fundamentals of Pharmacology",
    description: "DVP-124 — dosage forms, routes, compounding/dispensing principles and classification of veterinary drugs.",
  },
  {
    title: "Essentials of Medical Pharmacology",
    author: "K. D. Tripathi",
    publisher: "Jaypee",
    subject: "Fundamentals of Pharmacology",
    description: "DVP-124 — Indian standard for drug actions, dosage calculation, prescription reading and Latin abbreviations.",
  },
  {
    title: "Lehninger Principles of Biochemistry",
    author: "D. L. Nelson, M. M. Cox",
    publisher: "W. H. Freeman",
    subject: "Introduction to Clinical Biochemistry",
    description: "DVP-125 — carbohydrate, lipid and protein biochemistry with metabolism in health and disease.",
  },
  {
    title: "Clinical Biochemistry of Domestic Animals",
    author: "J. J. Kaneko",
    publisher: "Elsevier",
    subject: "Introduction to Clinical Biochemistry",
    description: "DVP-125 — blood sugar, ketones, BUN, enzymes and urine/blood diagnostic tests in animals.",
  },
  {
    title: "Arthur's Veterinary Reproduction and Obstetrics",
    author: "D. E. Noakes et al.",
    publisher: "Elsevier",
    subject: "Introduction to Gynaecology and Obstetrics",
    description: "DVP-126 — estrous cycles, pregnancy diagnosis, parturition assistance and infertility basics.",
  },
  {
    title: "Reproduction in Farm Animals",
    author: "E. S. E. Hafez, B. Hafez",
    publisher: "Wiley-Blackwell",
    subject: "Introduction to Gynaecology and Obstetrics",
    description: "DVP-126 — reproductive physiology, AI principles and newborn care across species.",
  },
  // ── Semester III ──
  {
    title: "Veterinary Medicine: A Textbook of the Diseases of Cattle, Horses, Sheep, Pigs and Goats",
    author: "O. M. Radostits et al.",
    publisher: "Elsevier",
    subject: "Basics of Clinical Veterinary Medicine",
    description: "DVP-211 — clinical examination, injections, instruments, systemic diseases and prevention.",
  },
  {
    title: "Reproduction in Farm Animals",
    author: "E. S. E. Hafez, B. Hafez",
    publisher: "Wiley-Blackwell",
    subject: "Introduction to Andrology and Artificial Insemination",
    description: "DVP-212 — male reproduction, semen collection/evaluation/preservation and AI technique.",
  },
  {
    title: "Diffusion of Innovations",
    author: "E. M. Rogers",
    publisher: "Free Press",
    subject: "Introduction to Animal Husbandry Extension",
    description: "DVP-213 — classic on extension teaching methods, communication, motivation and programme organization.",
  },
  {
    title: "Farm Animal Surgery",
    author: "S. L. Fubini, N. G. Ducharme",
    publisher: "Elsevier",
    subject: "Preliminary Surgical Procedures and Care",
    description: "DVP-214 — wounds, abscesses, fractures, first aid, bandaging, castration and pre/post-operative care.",
  },
  {
    title: "Veterinary Epidemiology",
    author: "M. Thrusfield",
    publisher: "Wiley-Blackwell",
    subject: "Community Veterinary Pharmacy",
    description: "DVP-215 — disease investigation, zoonoses, vaccination programmes, waste and water management.",
  },
  {
    title: "Veterinary Toxicology: Basic and Clinical Principles",
    author: "R. C. Gupta",
    publisher: "Elsevier",
    subject: "Basic Concepts of Pharmacy and Toxicology",
    description: "DVP-216 — poison sources, mode of action, toxicity modifiers and treatment of poisoning.",
  },
  {
    title: "Pharmaceutics: The Science of Dosage Form Design",
    author: "M. E. Aulton",
    publisher: "Elsevier",
    subject: "Basic Concepts of Pharmacy and Toxicology",
    description: "DVP-216 — metrology, compounding, labelling, storage and preparation of mixtures, ointments and tinctures.",
  },
  // ── Semester IV (Hands on Trainings) ──
  {
    title: "Pharmaceutical Jurisprudence",
    author: "B. S. Kuchekar",
    publisher: "Nirali Prakashan",
    subject: "Veterinary Pharmacist Jurisprudence",
    description: "DVP-221 — Pharmacy Act 1948, Drugs & Cosmetics Act 1940, schedules, licensing and animal-related laws.",
  },
  {
    title: "Veterinary Laboratory Medicine: Interpretation and Diagnosis",
    author: "D. J. Meyer, J. W. Harvey",
    publisher: "Elsevier",
    subject: "Practical Laboratory Diagnosis",
    description: "DVP-222 — sample handling, haematology, urine/fluid examination and clinico-laboratory correlation.",
  },
  {
    title: "A Textbook of Clinical Pharmacy Practice",
    author: "G. Parthasarathi et al.",
    publisher: "Universities Press",
    subject: "Clinical Pharmacy",
    description: "DVP-223 — prescriptions, drug interactions, bioavailability and hospital pharmacy preparations.",
  },
  {
    title: "Hospital Pharmacy",
    author: "S. H. Merchant, J. S. Quadry",
    publisher: "B. S. Shah Prakashan",
    subject: "Veterinary Hospital Pharmacy",
    description: "DVP-224 — hospital records, drug distribution, sanitation, vaccination and post-operative routines.",
  },
  {
    title: "A Textbook of Animal Husbandry",
    author: "G. C. Banerjee",
    publisher: "Oxford & IBH",
    subject: "Farm Management Practices",
    description: "DVP-225 — dairy records, routine farm work, reporting proforma and performance analysis.",
  },
  {
    title: "The Merck Veterinary Manual",
    author: "Merck & Co.",
    publisher: "Merck",
    subject: "Exposure to Polyclinics",
    description: "DVP-226 — bedside clinical reference for TPR, drug administration, wound care, gynae/surgical assisting and X-ray basics.",
  },
];

async function main() {
  console.log("Seeding DVP books...");
  await prisma.book.deleteMany({ where: { level: "DVP" } });
  let order = 0;
  for (const b of books) {
    order += 1;
    await prisma.book.create({
      data: {
        title: b.title,
        author: b.author,
        publisher: b.publisher,
        subject: b.subject,
        level: "DVP",
        description: b.description,
        isRecommended: true,
        order,
      },
    });
  }
  console.log(`Done: ${books.length} DVP books.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
