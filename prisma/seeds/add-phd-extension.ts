import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const extensionCourses = [
  { courseCode: "RPE 700", title: "Research and Publication Ethics", creditHours: "1+1", unitNumber: 1 },
  { courseCode: "EXT 701", title: "Organizational Leadership and Management", creditHours: "2+0", unitNumber: 2 },
  { courseCode: "EXT 702", title: "Recent Trends in Research Techniques in Social Sciences", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "EXT 703", title: "Training for Development", creditHours: "1+1", unitNumber: 4 },
  { courseCode: "EXT 704", title: "Policies and Regulations in Livestock Sector", creditHours: "1+0", unitNumber: 5 },
  { courseCode: "EXT 705", title: "Educational Technology", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "EXT 706", title: "Dynamics of Social Change", creditHours: "2+0", unitNumber: 7 },
  { courseCode: "EXT 707", title: "Monitoring and Evaluation of Livestock Development Programmes", creditHours: "2+1", unitNumber: 8 },
  { courseCode: "EXT 708", title: "Theory Constructions in Social Sciences", creditHours: "1+0", unitNumber: 9 },
  { courseCode: "EXT 709", title: "Facilitation for Development", creditHours: "2+1", unitNumber: 10 },
  { courseCode: "EXT 710", title: "Managing Extension Organizations", creditHours: "2+1", unitNumber: 11 },
];

async function main() {
  console.log("Adding PhD Veterinary Extension Education courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Extension Education",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Extension Education subject not found in PhD!");
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

  console.log(`Added ${extensionCourses.length} courses to Veterinary Extension Education (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
