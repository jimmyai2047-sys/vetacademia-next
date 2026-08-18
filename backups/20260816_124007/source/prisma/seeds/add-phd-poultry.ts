import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const poultryCourses = [
  { courseCode: "PSC 701", title: "Applied Poultry Nutrition", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "PSC 702", title: "Recent Trends in Commercial Poultry Production", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "PSC 703", title: "Developments in Poultry Processing and Products Technology", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "PSC 704", title: "Emerging Diseases of Poultry and Health Management", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "PSC 705", title: "Applied Poultry Breeding", creditHours: "1+1", unitNumber: 5 },
  { courseCode: "PSC 706", title: "Poultry Economics, Marketing and Integration", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "PSC 707", title: "Diversified Poultry Production", creditHours: "2+1", unitNumber: 7 },
];

async function main() {
  console.log("Adding PhD Poultry Science courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Poultry Science",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Poultry Science subject not found in PhD!");
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

  console.log(`Added ${poultryCourses.length} courses to Poultry Science (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
