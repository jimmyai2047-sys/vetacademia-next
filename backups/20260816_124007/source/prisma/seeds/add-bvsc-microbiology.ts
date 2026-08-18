import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const microbiologyUnits = [
  { title: "GENERAL & SYSTEMATIC VETERINARY BACTERIOLOGY", unitNumber: 1 },
  { title: "VETERINARY MYCOLOGY", unitNumber: 2 },
  { title: "MICROBIAL BIOTECHNOLOGY", unitNumber: 3 },
  { title: "VETERINARY IMMUNOLOGY AND SEROLOGY", unitNumber: 4 },
  { title: "GENERAL AND SYSTEMATIC VETERINARY VIROLOGY", unitNumber: 5 },
];

async function main() {
  console.log("Adding BVSc Veterinary Microbiology units...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Microbiology",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Microbiology subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "3+2" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const unit of microbiologyUnits) {
    await prisma.chapter.create({
      data: {
        title: unit.title,
        content: `Unit ${unit.unitNumber}: ${unit.title}`,
        unitNumber: unit.unitNumber,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${microbiologyUnits.length} units to BVSc Veterinary Microbiology`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
