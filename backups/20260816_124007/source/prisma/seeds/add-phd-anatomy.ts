import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const anatomyCourses = [
  { courseCode: "RPE 700", title: "Research and Publication Ethics*", creditHours: "1+1", unitNumber: 1 },
  { courseCode: "ANA 701", title: "Myology, angiology, neurology and aesthesiology of equine, canine and porcine", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "ANA 702", title: "Principles and applications of biomechanics", creditHours: "1+0", unitNumber: 3 },
  { courseCode: "ANA 703", title: "Avian anatomy", creditHours: "1+1", unitNumber: 4 },
  { courseCode: "ANA 704", title: "Neuroanatomy", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "ANA 705", title: "Comparative endocrine anatomy", creditHours: "1+1", unitNumber: 6 },
  { courseCode: "ANA 706", title: "Theory and applications of electronmicroscopy", creditHours: "1+1", unitNumber: 7 },
  { courseCode: "ANA 707", title: "Histoenzymology and immunocytochemistry", creditHours: "2+1", unitNumber: 8 },
  { courseCode: "ANA 708", title: "Applied embryology and teratology", creditHours: "1+1", unitNumber: 9 },
  { courseCode: "ANA 709", title: "Functional veterinary anatomy", creditHours: "1+0", unitNumber: 10 },
  { courseCode: "ANA 710", title: "Gross anatomy of laboratory animals", creditHours: "1+1", unitNumber: 11 },
  { courseCode: "ANA 711", title: "Cross sectional anatomy of ox", creditHours: "0+1", unitNumber: 12 },
  { courseCode: "ANA 712", title: "Animal alternatives in veterinary anatomy", creditHours: "1+1", unitNumber: 13 },
  { courseCode: "ANA 713", title: "Special problem", creditHours: "0+2", unitNumber: 14 },
];

async function main() {
  console.log("Adding PhD Veterinary Anatomy courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Anatomy",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Anatomy subject not found in PhD!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of anatomyCourses) {
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

  console.log(`Added ${anatomyCourses.length} courses to Veterinary Anatomy (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
