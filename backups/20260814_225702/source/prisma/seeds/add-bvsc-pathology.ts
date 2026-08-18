import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const pathologyUnits = [
  { title: "GENERAL VETERINARY PATHOLOGY", unitNumber: 1 },
  { title: "SYSTEMIC VETERINARY PATHOLOGY", unitNumber: 2 },
  { title: "ANIMAL ONCOLOGY, VETERINARY CLINICAL PATHOLOGY AND NECROPSY", unitNumber: 3 },
  { title: "PATHOLOGY OF INFECTIOUS AND NON-INFECTIOUS DISEASES OF DOMESTIC ANIMALS", unitNumber: 4 },
  { title: "AVIAN PATHOLOGY", unitNumber: 5 },
  { title: "PATHOLOGY OF DISEASES OF LABORATORY AND WILD ANIMALS", unitNumber: 6 },
];

async function main() {
  console.log("Adding BVSc Veterinary Pathology units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Pathology",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Pathology subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "4+2" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of pathologyUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${pathologyUnits.length} units to BVSc Veterinary Pathology`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
