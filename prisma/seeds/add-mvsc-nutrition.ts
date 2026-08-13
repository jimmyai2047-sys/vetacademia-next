import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const nutritionCourses = [
  { courseCode: "ANN 601*", title: "Nutritional Biochemistry", creditHours: "1+0", unitNumber: 1 },
  { courseCode: "ANN 602*", title: "Energy and Protein Nutrition", creditHours: "2+0", unitNumber: 2 },
  { courseCode: "ANN 603*", title: "Minerals and Vitamin Nutrition and Feed Additives", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "ANN 604*", title: "Feed and Fodder Technology", creditHours: "1+1", unitNumber: 4 },
  { courseCode: "ANN 605*", title: "Ruminant Nutrition", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "ANN 606*", title: "Non-Ruminant Nutrition", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "ANN 607*", title: "Research Methodology in Animal Nutrition", creditHours: "0+2", unitNumber: 7 },
  { courseCode: "ANN 608", title: "Companion Animal Nutrition", creditHours: "1+0", unitNumber: 8 },
  { courseCode: "ANN 609", title: "Nutrition of Laboratory, Wild and Zoo Animals", creditHours: "2+1", unitNumber: 9 },
  { courseCode: "ANN 610", title: "Non-Conventional Feed Resources", creditHours: "1+1", unitNumber: 10 },
  { courseCode: "ANN 611", title: "Introductory Clinical Nutrition", creditHours: "1+0", unitNumber: 11 },
  { courseCode: "ANN 612", title: "Rumen Biotechnology", creditHours: "1+0", unitNumber: 12 },
];

async function main() {
  console.log("Adding MVSc Animal Nutrition courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Animal Nutrition",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Animal Nutrition subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of nutritionCourses) {
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

  console.log(`Added ${nutritionCourses.length} courses to Animal Nutrition (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
