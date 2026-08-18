import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const pharmacologyCourses = [
  { courseCode: "VPT 601", title: "Molecular Pharmacology*", creditHours: "3+0", unitNumber: 1 },
  { courseCode: "VPT 602", title: "Advances in Autacoid Pharmacology", creditHours: "1+0", unitNumber: 2 },
  { courseCode: "VPT 603", title: "Pharmacology of Herbal Drugs", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "VPT 604", title: "Biotransformation of Xenobiotics", creditHours: "2+0", unitNumber: 4 },
  { courseCode: "VPT 605", title: "Clinical Pharmacology and Pharmacokinetics*", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "VPT 606", title: "Pharmacogenomics", creditHours: "2+0", unitNumber: 6 },
  { courseCode: "VPT 607", title: "Immunopharmacology and Immunotoxicology", creditHours: "2+0", unitNumber: 7 },
  { courseCode: "VPT 608", title: "Molecular Toxicology", creditHours: "3+0", unitNumber: 8 },
  { courseCode: "VPT 609", title: "Clinical Toxicology*", creditHours: "2+1", unitNumber: 9 },
  { courseCode: "VPT 610", title: "Ecotoxicology", creditHours: "3+0", unitNumber: 10 },
  { courseCode: "VPT 611", title: "Regulatory Toxicology", creditHours: "2+1", unitNumber: 11 },
  { courseCode: "VPT 690", title: "Special Problem", creditHours: "0+1", unitNumber: 12 },
];

async function main() {
  console.log("Adding PhD Veterinary Pharmacology and Toxicology courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Pharmacology and Toxicology",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Pharmacology and Toxicology subject not found in PhD!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of pharmacologyCourses) {
    await prisma.chapter.create({
      data: {
        title: course.title,
        content: `Credit Hours: ${course.creditHours}`,
        unitNumber: course.unitNumber,
        courseCode: course.courseCode,
        creditHours: course.creditHours,
        subjectId: subject.id,
      },
    });
  }

  console.log(`Added ${pharmacologyCourses.length} courses to Veterinary Pharmacology and Toxicology (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
