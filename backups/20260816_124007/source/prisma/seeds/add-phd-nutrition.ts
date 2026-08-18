import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const nutritionCourses = [
  { courseCode: "ANN 701", title: "Modern Concepts in Feeding of Ruminants", creditHours: "2+0", unitNumber: 1 },
  { courseCode: "ANN 702", title: "Forages in Animal Nutrition", creditHours: "1+0", unitNumber: 2 },
  { courseCode: "ANN 703", title: "Recent Concepts in Feeding of Non-Ruminants", creditHours: "1+0", unitNumber: 3 },
  { courseCode: "ANN 704", title: "Advances in Rumen Metabolism", creditHours: "1+1", unitNumber: 4 },
  { courseCode: "ANN 705", title: "Advances in Mineral and Vitamin Nutrition", creditHours: "2+0", unitNumber: 5 },
  { courseCode: "ANN 706", title: "Advanced Clinical Nutrition", creditHours: "1+1", unitNumber: 6 },
  { courseCode: "ANN 707", title: "Advanced Techniques in Nutritional Research", creditHours: "1+1", unitNumber: 7 },
  { courseCode: "ANN 708", title: "Advances in Feed Technology", creditHours: "1+0", unitNumber: 8 },
  { courseCode: "ANN 709", title: "Toxicants and Anti-Metabolites in Animal Nutrition", creditHours: "1+0", unitNumber: 9 },
  { courseCode: "ANN 710", title: "Nutrigenomics in Animal Nutrition", creditHours: "1+0", unitNumber: 10 },
  { courseCode: "ANN 711", title: "Equine Nutrition", creditHours: "1+0", unitNumber: 11 },
];

async function main() {
  console.log("Adding PhD Animal Nutrition courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Animal Nutrition",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Animal Nutrition subject not found in PhD!");
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

  console.log(`Added ${nutritionCourses.length} courses to Animal Nutrition (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
