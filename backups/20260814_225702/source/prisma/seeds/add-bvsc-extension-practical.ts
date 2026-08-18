import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const practicalUnits = [
  // Part-I
  { title: "Part-I — Unit-1: Tools of data collection", unitNumber: 1 },
  { title: "Part-I — Unit-2: Preparation of instrument for conducting social survey", unitNumber: 2 },
  { title: "Part-I — Unit-3: Visit to nearby village", unitNumber: 3 },
  { title: "Part-I — Unit-4: Conducting social survey for assessment of farming system and constraints", unitNumber: 4 },
  { title: "Part-I — Unit-5: Data analysis and reporting; Organizing demonstration for farmers", unitNumber: 5 },
  { title: "Part-I — Unit-6: Identification of key communicators by Socio-metric method", unitNumber: 6 },
  { title: "Part-I — Unit-7: Familiarization with audio-visual aids", unitNumber: 7 },
  { title: "Part-I — Unit-8: Principle and use of projectors", unitNumber: 8 },
  { title: "Part-I — Unit-9: Preparation of Radio Script; Preparation of Television script", unitNumber: 9 },
  { title: "Part-I — Unit-10: Preparation and use of poster", unitNumber: 10 },
  { title: "Part-I — Unit-12: Preparation and use of chart", unitNumber: 11 },
  { title: "Part-I — Unit-13: Preparation and use of flash cards", unitNumber: 12 },
  { title: "Part-I — Unit-15: Preparation and use of farm publications for extension work", unitNumber: 13 },
  { title: "Part-I — Unit-16: Planning and organizing an awareness campaign (Health and Production)", unitNumber: 14 },
  { title: "Part-I — Unit-17: Planning and organization of animal health camps", unitNumber: 15 },
  { title: "Part-I — Unit-18: Exercise on rapid rural appraisal (RRA)", unitNumber: 16 },
  { title: "Part-I — Unit-19: Exercise on participatory rural appraisal (PRA) technique", unitNumber: 17 },
  { title: "Part-I — Unit-20: Planning and organization of group discussion", unitNumber: 18 },
  // Part-II
  { title: "Part-II — Unit-1: Rules of debit and credit in livestock business transactions", unitNumber: 19 },
  { title: "Part-II — Unit-2: Journal Entry and Ledger Posting", unitNumber: 20 },
  { title: "Part-II — Unit-3: Writing of Cash Book", unitNumber: 21 },
  { title: "Part-II — Unit-4: Balancing and preparation of final accounts", unitNumber: 22 },
  { title: "Part-II — Unit-5: Exercise on calculation of depreciation", unitNumber: 23 },
  { title: "Part-II — Unit-6: Visit to commercial enterprises of livestock production", unitNumber: 24 },
  { title: "Part-II — Unit-7: Preparation of dairy entrepreneurial project report", unitNumber: 25 },
  { title: "Part-II — Unit-8: Preparation of sheep and goat entrepreneurial project report", unitNumber: 26 },
  { title: "Part-II — Unit-9: Preparation of poultry entrepreneurial project report", unitNumber: 27 },
  { title: "Part-II — Unit-10: Preparation of piggery or rabbit entrepreneurial project report", unitNumber: 28 },
  { title: "Part-II — Unit-11: Techno-economic feasibility report", unitNumber: 29 },
  { title: "Part-II — Unit-12: Exercise on Break-even analysis", unitNumber: 30 },
  { title: "Part-II — Unit-13: Exercise on BCR, IRR and NPW", unitNumber: 31 },
  { title: "Part-II — Unit-14: Case study of successful entrepreneurial project", unitNumber: 32 },
  { title: "Part-II — Unit-15: Visit to livestock market; Visit to livestock fair", unitNumber: 33 },
  { title: "Part-II — Unit-16: Exercise on economics of diseases", unitNumber: 34 },
];

async function main() {
  console.log("Adding BVSc Extension practical units (Part-I + Part-II)...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary and Animal Husbandry Extension Education",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary and Animal Husbandry Extension Education subject not found in BVSc!");
    return;
  }

  // Mark existing theory units
  await prisma.chapter.updateMany({
    where: { subjectId: subject.id, type: null },
    data: { type: "THEORY" },
  });

  // Skip if practical already exist
  const existingPractical = await prisma.chapter.count({
    where: { subjectId: subject.id, type: "PRACTICAL" },
  });
  if (existingPractical > 0) {
    console.log(`SKIP: ${existingPractical} practical units already exist`);
    return;
  }

  for (const unit of practicalUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: unit.title,
        unitNumber: unit.unitNumber,
        type: "PRACTICAL",
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${practicalUnits.length} practical units to Extension (Part-I: 18, Part-II: 16)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
