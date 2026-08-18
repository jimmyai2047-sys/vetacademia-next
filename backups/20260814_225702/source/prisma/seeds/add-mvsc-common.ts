import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const commonCourses = [
  { courseCode: "PGS 601", title: "Technical Writing and Communications Skills", creditHours: "0+1", unitNumber: 1 },
  { courseCode: "PGS 602", title: "Agricultural Research, Research Ethics and Rural Development Programmes", creditHours: "1+0", unitNumber: 2 },
  { courseCode: "PGS 603", title: "Basic Concepts in Laboratory Techniques", creditHours: "0+1", unitNumber: 3 },
  { courseCode: "PGS 604", title: "Intellectual Property and its Management in Agriculture", creditHours: "1+0", unitNumber: 4 },
  { courseCode: "PGS 605", title: "Library and Information Services", creditHours: "0+1", unitNumber: 5 },
];

async function main() {
  console.log("Adding MVSc Common Courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Common Courses",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Common Courses subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of commonCourses) {
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

  console.log(`Added ${commonCourses.length} courses to Common Courses (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
