import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const extensionCourses = [
  { courseCode: "EXT 601", title: "Development Perspectives of Extension Education", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "EXT 602", title: "Communication for Livestock Development", creditHours: "1+1", unitNumber: 2 },
  { courseCode: "EXT 603", title: "Diffusion and Adoption of Innovations", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "EXT 604", title: "Programme Planning and Evaluation", creditHours: "1+1", unitNumber: 4 },
  { courseCode: "EXT 605", title: "Research Methodology", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "EXT 606", title: "Social Psychology and Group Dynamics", creditHours: "1+1", unitNumber: 6 },
  { courseCode: "EXT 607", title: "Livestock Entrepreneurship", creditHours: "1+2", unitNumber: 7 },
  { courseCode: "EXT 608", title: "Human Resource Management in Animal Husbandry Sector", creditHours: "1+1", unitNumber: 8 },
  { courseCode: "EXT 609", title: "Gender Empowerment and Livestock Development", creditHours: "1+0", unitNumber: 9 },
  { courseCode: "EXT 610", title: "Farm Journalism", creditHours: "1+1", unitNumber: 10 },
  { courseCode: "SSS 600", title: "Statistics for Social Sciences", creditHours: "2+1", unitNumber: 11 },
];

async function main() {
  console.log("Adding MVSc Veterinary Extension Education courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Extension Education",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Extension Education subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of extensionCourses) {
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

  console.log(`Added ${extensionCourses.length} courses to Veterinary Extension Education (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
