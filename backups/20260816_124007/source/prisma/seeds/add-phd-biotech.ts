import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const biotechCourses = [
  { courseCode: "RPE 700", title: "Research and Publication Ethics*", creditHours: "1+1", unitNumber: 1 },
  { courseCode: "BTY 701", title: "Genetic Engineering", creditHours: "1+2", unitNumber: 2 },
  { courseCode: "BTY 702", title: "Functional Genomics and Proteomics", creditHours: "3+0", unitNumber: 3 },
  { courseCode: "BTY 703", title: "Advances in Cell and Molecular Biology", creditHours: "2+0", unitNumber: 4 },
  { courseCode: "BTY 704", title: "Diagnostic Platform", creditHours: "1+1", unitNumber: 5 },
  { courseCode: "BTY 705", title: "Gene Manipulation and Genome Editing", creditHours: "2+0", unitNumber: 6 },
  { courseCode: "BTY 706", title: "Trends in Vaccinology", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "BTY 707", title: "Advances in Bioinformatics", creditHours: "1+1", unitNumber: 8 },
  { courseCode: "BTY 708", title: "Advances in Reproductive Biotechnology", creditHours: "2+1", unitNumber: 9 },
  { courseCode: "BTY 709", title: "Advances in Animal Cell Culture", creditHours: "2+1", unitNumber: 10 },
  { courseCode: "BTY 710", title: "Industrial Biotechnology", creditHours: "2+1", unitNumber: 11 },
  { courseCode: "BTY 711", title: "Rumen and Feed Biotechnology", creditHours: "2+1", unitNumber: 12 },
];

async function main() {
  console.log("Adding PhD Veterinary Biotechnology courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Biotechnology",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Biotechnology subject not found in PhD!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of biotechCourses) {
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

  console.log(`Added ${biotechCourses.length} courses to Veterinary Biotechnology (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
