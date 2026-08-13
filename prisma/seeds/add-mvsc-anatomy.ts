import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const anatomyCourses = [
  { courseCode: "ANA 601", title: "Comparative osteology and arthrology", creditHours: "1+2", unitNumber: 1 },
  { courseCode: "ANA 602", title: "Comparative splanchnology", creditHours: "2+2", unitNumber: 2 },
  { courseCode: "ANA 603", title: "Myology, angiology, neurology and aesthesiology of Ox", creditHours: "2+2", unitNumber: 3 },
  { courseCode: "ANA 604", title: "Gross, histological and histochemical techniques", creditHours: "1+3", unitNumber: 4 },
  { courseCode: "ANA 605", title: "Clinical anatomy", creditHours: "0+1", unitNumber: 5 },
  { courseCode: "ANA 606", title: "General histology and ultrastructure", creditHours: "1+1", unitNumber: 6 },
  { courseCode: "ANA 607", title: "Systemic histology and ultrastructure", creditHours: "3+1", unitNumber: 7 },
  { courseCode: "ANA 608", title: "Developmental anatomy", creditHours: "2+1", unitNumber: 8 },
  { courseCode: "ANA 609", title: "Wildlife and forensic anatomy", creditHours: "1+0", unitNumber: 9 },
];

async function main() {
  console.log("Adding MVSc Veterinary Anatomy courses...");

  // Find the Veterinary Anatomy subject in MVSc
  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const anatomySubject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Anatomy",
      programmeId: mvsc.id,
    },
  });

  if (!anatomySubject) {
    console.error("Veterinary Anatomy subject not found in MVSc!");
    return;
  }

  // Delete existing chapters for this subject
  await prisma.chapter.deleteMany({
    where: { subjectId: anatomySubject.id },
  });

  // Add new courses as chapters
  for (const course of anatomyCourses) {
    await prisma.chapter.create({
      data: {
        title: course.title,
        content: `Credit Hours: ${course.creditHours}`,
        unitNumber: course.unitNumber,
        courseCode: course.courseCode,
        creditHours: course.creditHours,
        subjectId: anatomySubject.id,
      },
    });
  }

  console.log(`Added ${anatomyCourses.length} courses to Veterinary Anatomy (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
