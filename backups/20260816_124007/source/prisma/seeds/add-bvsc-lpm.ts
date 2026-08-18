import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const lpmUnits = [
  { title: "GENERAL LIVESTOCK MANAGEMENT", unitNumber: 1 },
  { title: "FODDER PRODUCTION AND CONSERVATION", unitNumber: 2 },
  { title: "LIVESTOCK PRODUCTION MANAGEMENT-RUMINANTS", unitNumber: 3 },
  { title: "ZOO ANIMALS PRODUCTION MANAGEMENT", unitNumber: 4 },
  { title: "ANIMAL WELFARE", unitNumber: 5 },
  { title: "POULTRY PRODUCTION MANAGEMENT", unitNumber: 6 },
  { title: "DIVERSIFIED POULTRY PRODUCTION AND HATCHERY MANAGEMENT", unitNumber: 7 },
  { title: "LABORATORY OR RABBIT OR PET ANIMAL PRODUCTION MANAGEMENT", unitNumber: 8 },
  { title: "SWINE OR EQUINE OR CAMEL, YAK AND MITHUN PRODUCTION MANAGEMENT", unitNumber: 9 },
];

async function main() {
  console.log("Adding BVSc Livestock Production Management units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Livestock Production Management",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Livestock Production Management subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "4+2" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of lpmUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${lpmUnits.length} units to BVSc Livestock Production Management`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
