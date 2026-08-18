import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const poultryCourses = [
  { courseCode: "PSC 601*", title: "Poultry Breeding and Genetics", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "PSC 602*", title: "Poultry Nutrition and Feeding", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "PSC 603*", title: "Commercial Layer and Broiler Management", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "PSC 604*", title: "Breeder Stock and Hatchery Management", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "PSC 605", title: "Poultry Health and Biosecurity", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "PSC 606", title: "Management of Other Avian Species", creditHours: "3+1", unitNumber: 6 },
  { courseCode: "PSC 607*", title: "Poultry Products Technology", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "PSC 608", title: "Poultry Economics, Project Formulation and Marketing", creditHours: "2+1", unitNumber: 8 },
  { courseCode: "PSC 609*", title: "Physiology of Poultry Production", creditHours: "1+1", unitNumber: 9 },
  { courseCode: "PSC 610", title: "Commercial Poultry Nutrition", creditHours: "1+1", unitNumber: 10 },
  { courseCode: "PSC 611", title: "Poultry Welfare and Waste Management", creditHours: "2+0", unitNumber: 11 },
];

async function main() {
  console.log("Adding MVSc Poultry Science courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Poultry Science",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Poultry Science subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of poultryCourses) {
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

  console.log(`Added ${poultryCourses.length} courses to Poultry Science (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
