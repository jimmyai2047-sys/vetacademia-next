import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const lpmCourses = [
  { courseCode: "LPM 601*", title: "Cattle and Buffalo Production Management", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "LPM 602*", title: "Sheep and Goat Production Management", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "LPM 603*", title: "Swine Production Management", creditHours: "1+1", unitNumber: 3 },
  { courseCode: "LPM 604*", title: "Climatology and Livestock Production", creditHours: "1+1", unitNumber: 4 },
  { courseCode: "LPM 605*", title: "Behaviour and Welfare of Farm Animals", creditHours: "1+1", unitNumber: 5 },
  { courseCode: "LPM 606*", title: "Equine Production Management", creditHours: "1+1", unitNumber: 6 },
  { courseCode: "LPM 607*", title: "Companion Animal Production Management", creditHours: "1+1", unitNumber: 7 },
  { courseCode: "LPM 608", title: "Farm Hygiene and Waste Management", creditHours: "1+1", unitNumber: 8 },
  { courseCode: "LPM 609", title: "Integrated Livestock Farming Systems", creditHours: "1+1", unitNumber: 9 },
  { courseCode: "LPM 610", title: "Management and Conservation of Wild and Zoo Animals", creditHours: "1+1", unitNumber: 10 },
  { courseCode: "LPM 611", title: "Laboratory Animal Production Management", creditHours: "1+1", unitNumber: 11 },
  { courseCode: "LPM 612", title: "Livestock Business Management", creditHours: "1+1", unitNumber: 12 },
  { courseCode: "LPM 613", title: "Livestock Farm Machinery Management", creditHours: "0+2", unitNumber: 13 },
  { courseCode: "LPM 614", title: "Poultry Farm and Hatchery Management", creditHours: "1+1", unitNumber: 14 },
  { courseCode: "LPM 615", title: "Regional Animal Production Management", creditHours: "1+1", unitNumber: 15 },
];

async function main() {
  console.log("Adding MVSc Livestock Production and Management courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Livestock Production and Management",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Livestock Production and Management subject not found in MVSc!");
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

  console.log(`Added ${lpmCourses.length} courses to Livestock Production and Management (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
