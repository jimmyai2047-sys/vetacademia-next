import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const geneticsUnits = [
  { title: "BIOSTATISTICS AND COMPUTER APPLICATION", unitNumber: 1 },
  { title: "PRINCIPLES OF ANIMAL AND POPULATION GENETICS", unitNumber: 2 },
  { title: "PRINCIPLES OF ANIMAL BREEDING", unitNumber: 3 },
];

async function main() {
  console.log("Adding BVSc Animal Genetics and Breeding units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Animal Genetics and Breeding",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Animal Genetics and Breeding subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "3+1" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of geneticsUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${geneticsUnits.length} units to BVSc Animal Genetics and Breeding`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
