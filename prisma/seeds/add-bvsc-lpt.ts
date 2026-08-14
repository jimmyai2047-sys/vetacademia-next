import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const lptUnits = [
  { title: "MILK AND MILK PRODUCTS TECHNOLOGY", unitNumber: 1 },
  { title: "WOOL SCIENCE", unitNumber: 2 },
  { title: "ABATTOIR PRACTICES AND ANIMAL BYPRODUCTS TECHNOLOGY", unitNumber: 3 },
  { title: "MEAT SCIENCE", unitNumber: 4 },
];

async function main() {
  console.log("Adding BVSc Livestock Products Technology units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Livestock Products Technology",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Livestock Products Technology subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "2+1" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of lptUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${lptUnits.length} units to BVSc Livestock Products Technology`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
