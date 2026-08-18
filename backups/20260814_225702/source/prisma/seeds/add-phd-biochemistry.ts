import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const biochemCourses = [
  { courseCode: "RPE 700*", title: "Research and Publications Ethics", creditHours: "1+1", unitNumber: 1 },
  { courseCode: "BCT 701", title: "Applied Molecular Biochemistry and Systems Biology", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "BCT 702", title: "Membrane Biochemistry", creditHours: "2+0", unitNumber: 3 },
  { courseCode: "BCT 703", title: "Recent trends in Enzymology", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "BCT 704", title: "Diagnostic Techniques in Clinical Biochemistry", creditHours: "0+2", unitNumber: 5 },
  { courseCode: "BCT 705", title: "Recent Trends in Biochemical Techniques and Instrumentation", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "BCT 706", title: "Developmental Biochemistry", creditHours: "2+0", unitNumber: 7 },
  { courseCode: "BCT 707", title: "Bioinformatics Tools in Biochemistry", creditHours: "1+1", unitNumber: 8 },
  { courseCode: "BCT 708", title: "Environmental and Toxicological Biochemistry", creditHours: "2+0", unitNumber: 9 },
  { courseCode: "BCT 709", title: "Biochemistry of Diseases and Disorders", creditHours: "2+0", unitNumber: 10 },
  { courseCode: "BCT 710", title: "Immuno-Biochemistry", creditHours: "2+0", unitNumber: 11 },
  { courseCode: "BCT 711", title: "Special Problem", creditHours: "0+2", unitNumber: 12 },
];

async function main() {
  console.log("Adding PhD Veterinary Biochemistry courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Biochemistry",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Biochemistry subject not found in PhD!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of biochemCourses) {
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

  console.log(`Added ${biochemCourses.length} courses to Veterinary Biochemistry (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
