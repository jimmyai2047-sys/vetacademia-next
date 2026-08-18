import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const parasitologyUnits = [
  { title: "GENERAL VETERINARY PARASITOLOGY", unitNumber: 1 },
  { title: "TREMATODES AND CESTODES OF VETERINARY IMPORTANCE", unitNumber: 2 },
  { title: "NEMATODES OF VETERINARY IMPORTANCE", unitNumber: 3 },
  { title: "ARTHROPODS OF VETERINARY IMPORTANCE", unitNumber: 4 },
  { title: "PROTOZOA OF VETERINARY IMPORTANCE", unitNumber: 5 },
];

async function main() {
  console.log("Adding BVSc Veterinary Parasitology units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Parasitology",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Parasitology subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "3+2" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of parasitologyUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${parasitologyUnits.length} units to BVSc Veterinary Parasitology`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
