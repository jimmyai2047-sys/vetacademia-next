import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const lptCourses = [
  { courseCode: "LPT 601*", title: "Abattoir Practices and Meat Plant Operations", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "LPT 602*", title: "Fresh Meat Technology", creditHours: "1+1", unitNumber: 2 },
  { courseCode: "LPT 603*", title: "Processing and Preservation of Meat", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "LPT 604*", title: "Processing of Milk and Milk Products", creditHours: "1+1", unitNumber: 4 },
  { courseCode: "LPT 605*", title: "Packaging and Marketing of Livestock Products", creditHours: "1+1", unitNumber: 5 },
  { courseCode: "LPT 606*", title: "Microbiology and Quality Control of Livestock Products", creditHours: "1+1", unitNumber: 6 },
  { courseCode: "LPT 607*", title: "Slaughterhouse By-products Technology", creditHours: "1+1", unitNumber: 7 },
  { courseCode: "LPT 608", title: "In-Plant Training", creditHours: "0+2", unitNumber: 8 },
  { courseCode: "LPT 609", title: "Egg and Egg Products Technology", creditHours: "1+1", unitNumber: 9 },
  { courseCode: "LPT 610", title: "Market Milk Processing and Dairy Plant Practices", creditHours: "1+1", unitNumber: 10 },
  { courseCode: "LPT 611", title: "Processing and Marketing of Wool", creditHours: "1+1", unitNumber: 11 },
  { courseCode: "LPT 612", title: "Biotechnology of Foods of Animal Origin", creditHours: "1+1", unitNumber: 12 },
  { courseCode: "LPT 613", title: "Fish and Fish Products Technology", creditHours: "1+1", unitNumber: 13 },
];

async function main() {
  console.log("Adding MVSc Livestock Products Technology courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Livestock Products Technology",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Livestock Products Technology subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of lptCourses) {
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

  console.log(`Added ${lptCourses.length} courses to Livestock Products Technology (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
