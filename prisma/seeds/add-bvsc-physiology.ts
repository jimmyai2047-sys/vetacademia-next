import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const physiologyUnits = [
  { title: "BLOOD, CARDIOVASCULAR, NERVOUS AND MUSCULAR SYSTEMS", unitNumber: 1 },
  { title: "DIGESTIVE AND RESPIRATORY SYSTEMS", unitNumber: 2 },
  { title: "EXCRETORY AND ENDOCRINE SYSTEMS", unitNumber: 3 },
  { title: "REPRODUCTION, LACTATION, GROWTH AND ENVIRONMENTAL PHYSIOLOGY", unitNumber: 4 },
];

async function main() {
  console.log("Adding BVSc Veterinary Physiology units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Physiology",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Physiology subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "2+1" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of physiologyUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${physiologyUnits.length} units to BVSc Veterinary Physiology`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
