import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const anatomyUnits = [
  { title: "Introduction to anatomy and its branches", unitNumber: 1 },
  { title: "Fore limb", unitNumber: 2 },
  { title: "Head and neck", unitNumber: 3 },
  { title: "Thorax", unitNumber: 4 },
  { title: "Abdomen", unitNumber: 5 },
  { title: "Hind limb and pelvis", unitNumber: 6 },
  { title: "Cytology", unitNumber: 7 },
  { title: "Introduction to embryology", unitNumber: 8 },
];

async function main() {
  console.log("Adding BVSc Veterinary Anatomy units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Anatomy",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Anatomy subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "4+3" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of anatomyUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${anatomyUnits.length} units to BVSc Veterinary Anatomy`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
