import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const biochemCourses = [
  { courseCode: "BCT 601", title: "Biophysical Chemistry", creditHours: "2+0", unitNumber: 1 },
  { courseCode: "BCT 602", title: "Biochemistry of Biomolecules", creditHours: "2+0", unitNumber: 2 },
  { courseCode: "BCT 603", title: "Enzymology", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "BCT 604", title: "Analytical Techniques and Instrumentation in Biochemistry", creditHours: "1+1", unitNumber: 4 },
  { courseCode: "BCT 605", title: "Clinical Biochemistry of Animals", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "BCT 606", title: "Intermediary Metabolism and Regulation", creditHours: "3+0", unitNumber: 6 },
  { courseCode: "BCT 607", title: "Molecular Biochemistry", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "BCT 608", title: "Nutritional and Industrial Biochemistry", creditHours: "2+0", unitNumber: 8 },
  { courseCode: "BCT 609", title: "Endocrinology and Reproductive Biochemistry", creditHours: "2+0", unitNumber: 9 },
  { courseCode: "BCT 610", title: "Biochemistry of Ruminants and Wild Animals", creditHours: "1+1", unitNumber: 10 },
  { courseCode: "BCT 611", title: "Introduction to Bioinformatics and Computational Biology", creditHours: "1+1", unitNumber: 11 },
];

async function main() {
  console.log("Adding MVSc Veterinary Biochemistry courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Biochemistry",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Biochemistry subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of biochemCourses) {
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

  console.log(`Added ${biochemCourses.length} courses to Veterinary Biochemistry (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
