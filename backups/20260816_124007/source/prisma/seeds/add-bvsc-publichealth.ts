import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const publicHealthUnits = [
  { title: "VETERINARY PUBLIC HEALTH AND FOOD SAFETY", unitNumber: 1 },
  { title: "VETERINARY EPIDEMIOLOGY", unitNumber: 2 },
  { title: "ZOONOTIC DISEASES", unitNumber: 3 },
  { title: "ENVIRONMENTAL HYGIENE", unitNumber: 4 },
];

async function main() {
  console.log("Adding BVSc Veterinary Public Health and Epidemiology units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Public Health and Epidemiology",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Public Health and Epidemiology subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "3+1" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of publicHealthUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${publicHealthUnits.length} units to BVSc Veterinary Public Health and Epidemiology`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
