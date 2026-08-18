import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const lptCourses = [
  { courseCode: "LPT 701", title: "Modern Abattoir Practices and Animal By-Products Technology", creditHours: "1+1", unitNumber: 1 },
  { courseCode: "LPT 702", title: "Advances in Meat Production and Fresh Meat Technology", creditHours: "1+1", unitNumber: 2 },
  { courseCode: "LPT 703", title: "Developments in Processed Meat Technology", creditHours: "1+1", unitNumber: 3 },
  { courseCode: "LPT 704", title: "Current Trends in Processing of Milk And Milk Products", creditHours: "1+1", unitNumber: 4 },
  { courseCode: "LPT 705", title: "Biotechnological Techniques and Quality Control of Livestock Products", creditHours: "1+1", unitNumber: 5 },
  { courseCode: "LPT 706", title: "Ethnic and Organic Meat and Milk Products", creditHours: "1+1", unitNumber: 6 },
  { courseCode: "LPT 707", title: "Industrial and Entrepreneurial Training", creditHours: "0+2", unitNumber: 7 },
  { courseCode: "LPT 708", title: "Current Trends in Disposal and Utilization of Waste From Meat and Dairy Industry", creditHours: "1+1", unitNumber: 8 },
  { courseCode: "LPT 709", title: "Advances in Egg and Egg Products Technology", creditHours: "1+1", unitNumber: 9 },
];

async function main() {
  console.log("Adding PhD Livestock Products Technology courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Livestock Products Technology",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Livestock Products Technology subject not found in PhD!");
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

  console.log(`Added ${lptCourses.length} courses to Livestock Products Technology (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
