import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const biotechCourses = [
  { courseCode: "BTY 601", title: "Basic and Applied Biotechnology", creditHours: "2+0", unitNumber: 1 },
  { courseCode: "BTY 602", title: "Fundamentals of Cell Biology", creditHours: "2+0", unitNumber: 2 },
  { courseCode: "BTY 603", title: "Molecular Biology and Genetic Engineering", creditHours: "2+0", unitNumber: 3 },
  { courseCode: "BTY 604", title: "Animal Cell Culture–Principles and Applications", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "BTY 605", title: "Molecular Diagnostics", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "BTY 606", title: "Immunology Applied to Biotechnology", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "BTY 607", title: "Introduction to Bioinformatics", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "BTY 608", title: "Animal Genomics", creditHours: "2+1", unitNumber: 8 },
  { courseCode: "BTY 609", title: "Techniques in Molecular Biology and Genetic Engineering", creditHours: "0+2", unitNumber: 9 },
  { courseCode: "BTY 610", title: "Reproductive Biotechnology", creditHours: "2+1", unitNumber: 10 },
];

async function main() {
  console.log("Adding MVSc Veterinary Biotechnology courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Biotechnology",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Biotechnology subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of biotechCourses) {
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

  console.log(`Added ${biotechCourses.length} courses to Veterinary Biotechnology (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
