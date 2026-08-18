import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const geneticsCourses = [
  { courseCode: "AGB 701", title: "Molecular Genetics II", creditHours: "2+0", unitNumber: 1 },
  { courseCode: "AGB 702", title: "Trends in Animal Breeding", creditHours: "2+0", unitNumber: 2 },
  { courseCode: "AGB 703", title: "Biometrical Genetics II", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "AGB 704", title: "Advances in Selection Methodology", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "AGB 705", title: "Bioinformatics in Animal Breeding", creditHours: "1+1", unitNumber: 5 },
  { courseCode: "AGB 706", title: "Animal Cytogenetics and Immunogenetics II", creditHours: "2+0", unitNumber: 6 },
  { courseCode: "AGB 707", title: "Statistical Software in Animal Breeding", creditHours: "1+1", unitNumber: 7 },
];

async function main() {
  console.log("Adding PhD Animal Genetics and Breeding courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Animal Genetics and Breeding",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Animal Genetics and Breeding subject not found in PhD!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of geneticsCourses) {
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

  console.log(`Added ${geneticsCourses.length} courses to Animal Genetics and Breeding (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
