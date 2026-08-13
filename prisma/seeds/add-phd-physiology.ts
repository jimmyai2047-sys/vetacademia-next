import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const physiologyCourses = [
  { courseCode: "RPE 700", title: "Research and Publication Ethics*", creditHours: "1+1", unitNumber: 1 },
  { courseCode: "VPY 701", title: "Applied physiology of body fluids and electrolytes", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "VPY 702", title: "Physiology of animal behaviour", creditHours: "2+0", unitNumber: 3 },
  { courseCode: "VPY 703", title: "Recent trends in ruminant digestion", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VPY 704", title: "Recent trends in neuroendocrinology", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "VPY 705", title: "Myophysiology and kinesiology", creditHours: "2+0", unitNumber: 6 },
  { courseCode: "VPY 706", title: "Avian physiology", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "VPY 707", title: "Physiology of lactation", creditHours: "2+1", unitNumber: 8 },
  { courseCode: "VPY 708", title: "Recent trends in environmental physiology and growth", creditHours: "2+1", unitNumber: 9 },
  { courseCode: "VPY 709", title: "Cellular and molecular physiology", creditHours: "2+0", unitNumber: 10 },
  { courseCode: "VPY 710", title: "Recent trends in immuno-physiology", creditHours: "2+1", unitNumber: 11 },
  { courseCode: "VPY 711", title: "Physiology of stress", creditHours: "2+0", unitNumber: 12 },
  { courseCode: "VPY 712", title: "Recent trends in reproductive physiology", creditHours: "2+1", unitNumber: 13 },
];

async function main() {
  console.log("Adding PhD Veterinary Physiology courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Physiology",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Physiology subject not found in PhD!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of physiologyCourses) {
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

  console.log(`Added ${physiologyCourses.length} courses to Veterinary Physiology (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
