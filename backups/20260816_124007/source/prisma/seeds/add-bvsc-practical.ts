import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// BVSc subjects done so far (Extension excluded - user will provide different practical later)
const bvscSubjects = [
  "Veterinary Anatomy",
  "Veterinary Physiology",
  "Veterinary Biochemistry",
  "Livestock Production Management",
  "Veterinary Microbiology",
  "Veterinary Pathology",
  "Animal Genetics and Breeding",
  "Animal Nutrition",
  "Veterinary Pharmacology and Toxicology",
  "Veterinary Public Health and Epidemiology",
  "Veterinary Parasitology",
  "Livestock Products Technology",
];

async function main() {
  console.log("Adding Practical duplicates for BVSc subjects...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  for (const subjectName of bvscSubjects) {
    const subject = await prisma.subject.findFirst({
      where: { name: subjectName, programmeId: bvsc.id },
      include: { chapters: { orderBy: { unitNumber: "asc" } } },
    });

    if (!subject) {
      console.log(`SKIP: ${subjectName} not found`);
      continue;
    }

    // Mark existing chapters as THEORY
    await prisma.chapter.updateMany({
      where: { subjectId: subject.id },
      data: { type: "THEORY" },
    });

    // Create PRACTICAL duplicates (skip if already exist)
    const existingPractical = subject.chapters.filter((c) => c.type === "PRACTICAL");
    if (existingPractical.length > 0) {
      console.log(`SKIP: ${subjectName} already has ${existingPractical.length} practical units`);
      continue;
    }

    for (const ch of subject.chapters) {
      await prisma.chapter.create({
        data: {
          title: ch.title,
          content: ch.content,
          unitNumber: ch.unitNumber,
          type: "PRACTICAL",
          subjectId: subject.id,
        },
      });
    }

    console.log(`Added ${subject.chapters.length} practical units to ${subjectName}`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
