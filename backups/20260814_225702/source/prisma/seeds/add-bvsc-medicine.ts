import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const theoryUnits = [
  "GENERAL",
  "SYSTEMIC DISEASES",
  "METABOLIC AND DEFICIENCY DISORDERS",
  "ZOO AND WILD ANIMAL MEDICINE",
  "BACTERIAL, FUNGAL AND RICKETTSIAL DISEASES",
  "VIRAL AND PARASITIC DISEASES",
  "JURISPRUDENCE, ETHICS, AND ANIMAL WELFARE",
];

const practicalUnits = [
  "GENERAL",
  "SYSTEMIC DISEASES",
  "METABOLIC AND DEFICIENCY DISORDERS",
  "ZOO AND WILD ANIMAL MEDICINE",
  "BACTERIAL, FUNGAL AND RICKETTSIAL DISEASES",
  "VIRAL AND PARASITIC DISEASES",
];

async function main() {
  console.log("Adding BVSc Veterinary Medicine units (Theory + Practical)...");

  const bvsc = await prisma.programme.findFirst({
    where: { name: "BVSC" },
  });

  if (!bvsc) {
    console.error("BVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Medicine",
      programmeId: bvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Medicine subject not found in BVSc!");
    return;
  }

  await prisma.subject.update({
    where: { id: subject.id },
    data: { creditHours: "4+1" },
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

  console.log(`Added ${theoryUnits.length} theory + ${practicalUnits.length} practical units to Veterinary Medicine`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
