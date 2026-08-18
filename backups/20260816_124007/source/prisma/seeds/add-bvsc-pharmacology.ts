import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const pharmacologyUnits = [
  { title: "GENERAL PHARMACOLOGY", unitNumber: 1 },
  { title: "DRUGS ACTING ON AUTONOMIC NERVOUS SYSTEM", unitNumber: 2 },
  { title: "DRUGS ACTING ON CENTRAL NERVOUS SYSTEM", unitNumber: 3 },
  { title: "DRUGS ACTING ON DIFFERENT BODY SYSTEMS", unitNumber: 4 },
  { title: "VETERINARY CHEMOTHERAPY", unitNumber: 5 },
  { title: "VETERINARY TOXICOLOGY", unitNumber: 6 },
];

async function main() {
  console.log("Adding BVSc Veterinary Pharmacology and Toxicology units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Pharmacology and Toxicology",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Pharmacology and Toxicology subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "4+1" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of pharmacologyUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${pharmacologyUnits.length} units to BVSc Veterinary Pharmacology and Toxicology`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
