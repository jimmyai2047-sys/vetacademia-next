import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PLANS = [
  {
    slug: "ahdp",
    name: "A.H.D.P. (Animal Husbandry Diploma)",
    type: "COURSE",
    description:
      "Complete Animal Husbandry Diploma Programme syllabus, chapters and study material.",
    price: 999,
    programmeSlug: "ahdp",
    examSlug: null,
    sortOrder: 1,
  },
  {
    slug: "bvsc",
    name: "B.V.Sc & A.H.",
    type: "COURSE",
    description:
      "Full Bachelor of Veterinary Science & Animal Husbandry curriculum (MSVE-2016).",
    price: 2999,
    programmeSlug: "bvsc",
    examSlug: null,
    sortOrder: 2,
  },
  {
    slug: "mvsc",
    name: "M.V.Sc",
    type: "COURSE",
    description:
      "Postgraduate specializations across 18 departments with departmental structure.",
    price: 3999,
    programmeSlug: "mvsc",
    examSlug: null,
    sortOrder: 3,
  },
  {
    slug: "phd",
    name: "Ph.D (Veterinary Science)",
    type: "COURSE",
    description: "Doctoral research programme in veterinary science specializations.",
    price: 4999,
    programmeSlug: "phd",
    examSlug: null,
    sortOrder: 4,
  },
  {
    slug: "veterinary-officer",
    name: "Veterinary Officer (PSC)",
    type: "EXAM",
    description:
      "Complete preparation for State & Central PSC Veterinary Officer / Surgeon exams.",
    price: 1499,
    programmeSlug: null,
    examSlug: "veterinary-officer",
    sortOrder: 5,
  },
  {
    slug: "livestock-assistant",
    name: "Livestock Assistant (PSC)",
    type: "EXAM",
    description:
      "Targeted preparation for PSC Livestock Assistant recruitment examinations.",
    price: 999,
    programmeSlug: null,
    examSlug: "livestock-assistant",
    sortOrder: 6,
  },
  {
    slug: "icar-jrf-srf",
    name: "ICAR-JRF/SRF",
    type: "EXAM",
    description:
      "Comprehensive ICAR-JRF and ICAR-SRF entrance examination preparation.",
    price: 1999,
    programmeSlug: null,
    examSlug: "icar-jrf-srf",
    sortOrder: 7,
  },
  {
    slug: "net",
    name: "NET (ICAR/CSIR/UGC)",
    type: "EXAM",
    description:
      "Preparation for NET (ICAR / CSIR / UGC) lectureship and JRF eligibility.",
    price: 1499,
    programmeSlug: null,
    examSlug: "net",
    sortOrder: 8,
  },
  {
    slug: "ars",
    name: "ARS (ASRB)",
    type: "EXAM",
    description:
      "Targeted preparation for the ARS (Agricultural Research Scientist) examination.",
    price: 1999,
    programmeSlug: null,
    examSlug: "ars",
    sortOrder: 9,
  },
];

async function main() {
  for (const p of PLANS) {
    await prisma.plan.upsert({
      where: { slug: p.slug },
      update: { name: p.name, type: p.type, description: p.description, programmeSlug: p.programmeSlug, examSlug: p.examSlug, sortOrder: p.sortOrder },
      create: p,
    });
    console.log(`Upserted plan: ${p.slug}`);
  }
  console.log("Done seeding plans.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
