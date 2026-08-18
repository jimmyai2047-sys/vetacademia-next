import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const lpmCourses = [
  { courseCode: "LPM 701", title: "Recent Developments in Large Ruminants Production Management", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "LPM 702", title: "Recent Developments in Small Ruminants Production Management", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "LPM 703", title: "Recent Developments in Swine Production Management", creditHours: "1+1", unitNumber: 3 },
  { courseCode: "LPM 704", title: "Livestock and Environment", creditHours: "1+0", unitNumber: 4 },
  { courseCode: "LPM 705", title: "Organic Livestock Production", creditHours: "1+0", unitNumber: 5 },
  { courseCode: "LPM 706", title: "Recent Developments in Welfare of Farm Animals", creditHours: "1+0", unitNumber: 6 },
  { courseCode: "LPM 707", title: "Entrepreneurship in Livestock Production", creditHours: "1+1", unitNumber: 7 },
  { courseCode: "LPM 708", title: "Precision Livestock Farming", creditHours: "1+1", unitNumber: 8 },
  { courseCode: "LPM 709", title: "Recent Developments in Poultry Production Management", creditHours: "2+1", unitNumber: 9 },
];

async function main() {
  console.log("Adding PhD Livestock Production and Management courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Livestock Production and Management",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Livestock Production and Management subject not found in PhD!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of lpmCourses) {
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

  console.log(`Added ${lpmCourses.length} courses to Livestock Production and Management (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
