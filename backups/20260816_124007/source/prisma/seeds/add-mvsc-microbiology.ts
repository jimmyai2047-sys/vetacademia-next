import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const microCourses = [
  { courseCode: "VMC 501", title: "General Bacteriology*", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "VMC 502", title: "Systematic Veterinary Bacteriology", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "VMC 503", title: "General Virology*", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "VMC 504", title: "Systematic Veterinary Virology", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VMC 505", title: "Principles of Veterinary Immunology*", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "VMC 506", title: "Veterinary Mycology*", creditHours: "1+1", unitNumber: 6 },
  { courseCode: "VMC 507", title: "Vaccinology", creditHours: "2+0", unitNumber: 7 },
  { courseCode: "VMC 508", title: "Techniques in Microbiology", creditHours: "0+2", unitNumber: 8 },
  { courseCode: "VMC 509", title: "Techniques in Molecular Microbiology", creditHours: "1+2", unitNumber: 9 },
  { courseCode: "VMC 510", title: "Molecular Immunology", creditHours: "1+1", unitNumber: 10 },
  { courseCode: "VMC 511", title: "Mucosal Immunology", creditHours: "1+0", unitNumber: 11 },
  { courseCode: "VMC 512", title: "Introduction to Microbial Bio-informatics", creditHours: "1+0", unitNumber: 12 },
];

async function main() {
  console.log("Adding MVSc Veterinary Microbiology courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Microbiology",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Microbiology subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of microCourses) {
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

  console.log(`Added ${microCourses.length} courses to Veterinary Microbiology (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
