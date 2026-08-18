import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const nutritionUnits = [
  { title: "PRINCIPLES OF ANIMAL NUTRITION AND FEED TECHNOLOGY", unitNumber: 1 },
  { title: "APPLIED RUMINANT NUTRITION-I", unitNumber: 2 },
  { title: "APPLIED RUMINANT NUTRITION-II", unitNumber: 3 },
  { title: "APPLIED NON-RUMINANT NUTRITION", unitNumber: 4 },
];

async function main() {
  console.log("Adding BVSc Animal Nutrition units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Animal Nutrition",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Animal Nutrition subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "3+1" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of nutritionUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${nutritionUnits.length} units to BVSc Animal Nutrition`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
