import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const pathologyCourses = [
  { courseCode: "VPL 501", title: "General Pathology*", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "VPL 502", title: "Techniques in Pathology*", creditHours: "0+2", unitNumber: 2 },
  { courseCode: "VPL 503", title: "Animal Oncology", creditHours: "1+1", unitNumber: 3 },
  { courseCode: "VPL 504", title: "Clinical Pathology*", creditHours: "1+1", unitNumber: 4 },
  { courseCode: "VPL 505", title: "Necropsy Procedures and Interpretations*", creditHours: "1+1", unitNumber: 5 },
  { courseCode: "VPL 506", title: "Necropsy Conference*", creditHours: "0+1", unitNumber: 6 },
  { courseCode: "VPL 507", title: "Systemic Pathology*", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "VPL 508", title: "Pathology of Infectious Diseases of Domestic Animals*", creditHours: "2+1", unitNumber: 8 },
  { courseCode: "VPL 509", title: "Toxicopathology", creditHours: "2+1", unitNumber: 9 },
  { courseCode: "VPL 510", title: "Avian Pathology*", creditHours: "2+1", unitNumber: 10 },
  { courseCode: "VPL 511", title: "Pathology of Wild/ Zoo and Aquatic Animal Diseases", creditHours: "2+1", unitNumber: 11 },
  { courseCode: "VPL 512", title: "Pathology of Laboratory Animal Diseases", creditHours: "2+1", unitNumber: 12 },
];

async function main() {
  console.log("Adding MVSc Veterinary Pathology courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Pathology",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Pathology subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of pathologyCourses) {
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

  console.log(`Added ${pathologyCourses.length} courses to Veterinary Pathology (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
