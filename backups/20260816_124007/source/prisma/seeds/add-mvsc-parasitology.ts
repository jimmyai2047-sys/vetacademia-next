import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const parasitologyCourses = [
  { courseCode: "VPA 501", title: "Platyhelminthes-I*", creditHours: "1+1", unitNumber: 1 },
  { courseCode: "VPA 502", title: "Platyhelminthes-II*", creditHours: "1+1", unitNumber: 2 },
  { courseCode: "VPA 503", title: "Nemathelminthes and Acanthocephala*", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "VPA 504", title: "Arthropod Parasites*", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VPA 505", title: "Parasitic Protozoa*", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "VPA 506", title: "Diagnostic Parasitology", creditHours: "0+2", unitNumber: 6 },
  { courseCode: "VPA 507", title: "Clinical Parasitology", creditHours: "1+1", unitNumber: 7 },
  { courseCode: "VPA 508", title: "Management of Parasitic Diseases", creditHours: "1+1", unitNumber: 8 },
  { courseCode: "VPA 509", title: "Immunoparasitology", creditHours: "2+1", unitNumber: 9 },
  { courseCode: "VPA 510", title: "Parasitic Zoonoses", creditHours: "2+0", unitNumber: 10 },
  { courseCode: "VPA 511", title: "Parasites of Wildlife", creditHours: "1+1", unitNumber: 11 },
];

async function main() {
  console.log("Adding MVSc Veterinary Parasitology courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Parasitology",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Parasitology subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of parasitologyCourses) {
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

  console.log(`Added ${parasitologyCourses.length} courses to Veterinary Parasitology (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
