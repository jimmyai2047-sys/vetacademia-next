import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const physioCourses = [
  { courseCode: "VPY 601", title: "Physiology of Digestion", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "VPY 602", title: "Cardiovascular and Respiratory Physiology", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "VPY 603", title: "Renal Physiology and Body Fluid dynamics", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "VPY 604", title: "Haematology", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VPY 605", title: "Growth and Environmental Physiology", creditHours: "2+0", unitNumber: 5 },
  { courseCode: "VPY 606", title: "Physiology of Animal Reproduction", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "VPY 607", title: "Clinical Physiology", creditHours: "1+1", unitNumber: 7 },
  { courseCode: "VPY 608", title: "Neuromuscular Physiology", creditHours: "2+0", unitNumber: 8 },
  { courseCode: "VPY 609", title: "Endocrinology of Domestic Animals", creditHours: "2+0", unitNumber: 9 },
  { courseCode: "VPY 610", title: "Instrumentation and Research Techniques in Veterinary Physiology", creditHours: "0+2", unitNumber: 10 },
  { courseCode: "VPY 611", title: "Physiology of Wild Life", creditHours: "1+0", unitNumber: 11 },
];

async function main() {
  console.log("Adding MVSc Veterinary Physiology courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Physiology",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Physiology subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of physioCourses) {
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

  console.log(`Added ${physioCourses.length} courses to Veterinary Physiology (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
