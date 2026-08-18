import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const extensionUnits = [
  { title: "LIVESTOCK BASED LIVELIHOODS AND THEIR EVOLUTION", unitNumber: 1 },
  { title: "EXTENSION EDUCATION AND DEVELOPMENT", unitNumber: 2 },
  { title: "RURAL SOCIOLOGY IN VETERINARY EXTENSION", unitNumber: 3 },
  { title: "TRANSFER OF TECHNOLOGY FOR LIVESTOCK DEVELOPMENT", unitNumber: 4 },
  { title: "COMMUNICATION AND EXTENSION TEACHING METHODS", unitNumber: 5 },
  { title: "LIVESTOCK ECONOMICS AND MARKETING", unitNumber: 6 },
  { title: "LIVESTOCK ENTREPRENEURSHIP", unitNumber: 7 },
  { title: "INFORMATION AND COMMUNICATION TECHNOLOGY", unitNumber: 8 },
  { title: "CONTEMPORARY ISSUES IN LIVESTOCK ENTERPRISES", unitNumber: 9 },
];

async function main() {
  console.log("Adding BVSc Veterinary and Animal Husbandry Extension Education units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary and Animal Husbandry Extension Education",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary and Animal Husbandry Extension Education subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "3+1" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of extensionUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${extensionUnits.length} units to BVSc Veterinary and Animal Husbandry Extension Education`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
