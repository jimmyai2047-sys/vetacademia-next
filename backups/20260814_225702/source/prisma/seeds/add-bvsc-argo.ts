import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const theoryUnits = [
  "VETERINARY GYNAECOLOGY",
  "VETERINARY OBSTETRICS",
  "VETERINARY ANDROLOGY AND A.I.",
];

const practicalUnits = [
  "VETERINARY GYNAECOLOGY",
  "VETERINARY OBSTETRICS",
  "VETERINARY ANDROLOGY AND A.I. AND ASSISTED REPRODUCTIVE TECHNIQUES",
];

async function main() {
  console.log("Adding BVSc Veterinary Gynaecology and Obstetrics units (Theory + Practical)...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Gynaecology and Obstetrics",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Gynaecology and Obstetrics subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "2+1" },
  });

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (let i = 0; i < theoryUnits.length; i++) {
    const unitNumber = i + 1;
    const title = theoryUnits[i];
    await prisma.chapter.create({
      data: {
        title,
        content: `Unit ${unitNumber}: ${title}`,
        unitNumber,
        type: "THEORY",
        subjectId: subject.id,
      },
    });
  }

  for (let i = 0; i < practicalUnits.length; i++) {
    const unitNumber = i + 1;
    const title = practicalUnits[i];
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

  console.log(`Added ${theoryUnits.length} theory + ${practicalUnits.length} practical units to Veterinary Gynaecology and Obstetrics`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
