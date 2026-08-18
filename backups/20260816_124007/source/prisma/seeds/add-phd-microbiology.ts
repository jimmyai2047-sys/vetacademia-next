import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const microbiologyCourses = [
  { courseCode: "VMC 601", title: "Advances in Veterinary Bacteriology*", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "VMC 602", title: "Advances in Veterinary Mycology", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "VMC 603", title: "Bacterial Genetics", creditHours: "2+0", unitNumber: 3 },
  { courseCode: "VMC 604", title: "Microbial Toxins", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VMC 605", title: "Bacterial Pathogenesis", creditHours: "2+0", unitNumber: 5 },
  { courseCode: "VMC 606", title: "Advances in Veterinary Virology*", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "VMC 607", title: "Molecular Viral Pathogenesis", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "VMC 608", title: "Structure Function Relationship of DNA and RNA Viruses", creditHours: "2+0", unitNumber: 8 },
  { courseCode: "VMC 609", title: "Oncogenic Viruses", creditHours: "2+0", unitNumber: 9 },
  { courseCode: "VMC 610", title: "Slow Viral Infections and Prions", creditHours: "1+0", unitNumber: 10 },
  { courseCode: "VMC 611", title: "Advances in Veterinary Immunology*", creditHours: "2+1", unitNumber: 11 },
  { courseCode: "VMC 612", title: "Cytokines and Chemokines", creditHours: "2+0", unitNumber: 12 },
  { courseCode: "VMC 613", title: "Immunoregulation", creditHours: "1+0", unitNumber: 13 },
  { courseCode: "VMC 614", title: "Advances in Vaccinology", creditHours: "2+0", unitNumber: 14 },
  { courseCode: "VMC 615", title: "Current topics in Infection and Immunity", creditHours: "2+0", unitNumber: 15 },
  { courseCode: "VMC 616", title: "Veterinary Microbial Biotechnology", creditHours: "2+1", unitNumber: 16 },
  { courseCode: "VMC 690", title: "Special Problem", creditHours: "0+1", unitNumber: 17 },
];

async function main() {
  console.log("Adding PhD Veterinary Microbiology courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Microbiology",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Microbiology subject not found in PhD!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of microbiologyCourses) {
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

  console.log(`Added ${microbiologyCourses.length} courses to Veterinary Microbiology (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
