import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const biochemistryUnits = [
  { title: "GENERAL VETERINARY BIOCHEMISTRY", unitNumber: 1 },
  { title: "INTERMEDIARY METABOLISM", unitNumber: 2 },
  { title: "VETERINARY ANALYTICAL BIOCHEMISTRY", unitNumber: 3 },
];

async function main() {
  console.log("Adding BVSc Veterinary Biochemistry units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Biochemistry",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Biochemistry subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "2+1" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of biochemistryUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${biochemistryUnits.length} units to BVSc Veterinary Biochemistry`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
