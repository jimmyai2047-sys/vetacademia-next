import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const units = [
  "VETERINARY GENERAL SURGERY",
  "VETERINARY ANAESTHESIOLOGY",
  "VETERINARY DIAGNOSTIC IMAGING TECHNIQUES",
  "REGIONAL SURGERY-I",
  "REGIONAL SURGERY-II",
  "ORTHOPEDICS AND LAMENESS",
];

async function main() {
  console.log("Adding BVSc Veterinary Surgery and Radiology units (Theory + Practical)...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Surgery and Radiology",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Surgery and Radiology subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "2+1" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (let i = 0; i < units.length; i++) {
    const unitNumber = i + 1;
    const title = units[i];
    // Theory
    await prisma.chapter.create({
      data: {
        title,
        content: `Unit ${unitNumber}: ${title}`,
        unitNumber,
        type: "THEORY",
        subjectId: subject.id,
      },
    });
    // Practical (same titles)
    await prisma.chapter.create({
      data: {
        title,
        content: `Unit ${unitNumber}: ${title}`,
        unitNumber,
        type: "PRACTICAL",
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${units.length} theory + ${units.length} practical units to Veterinary Surgery and Radiology`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
