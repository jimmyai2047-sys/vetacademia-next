import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const pharmacologyCourses = [
  { courseCode: "VPT 501", title: "Concepts of Pharmacology, Drug Design and Development*", creditHours: "2+0", unitNumber: 1 },
  { courseCode: "VPT 502", title: "Autonomic and Autacoid Pharmacology*", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "VPT 503", title: "CNS Pharmacology", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "VPT 504", title: "Digestive and Respiratory Pharmacology", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VPT 505", title: "Cardiovascular and Urinary System Pharmacology", creditHours: "2+0", unitNumber: 5 },
  { courseCode: "VPT 506", title: "Endocrine and Reproductive Pharmacology", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "VPT 507", title: "Chemotherapy*", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "VPT 508", title: "Toxicology of Xenobiotics*", creditHours: "2+1", unitNumber: 8 },
  { courseCode: "VPT 509", title: "Toxinology", creditHours: "2+1", unitNumber: 9 },
  { courseCode: "VPT 510", title: "Pharmacological Techniques*", creditHours: "0+2", unitNumber: 10 },
  { courseCode: "VPT 511", title: "Techniques in Toxicology*", creditHours: "0+2", unitNumber: 11 },
  { courseCode: "VPT 512", title: "Ethnopharmacology", creditHours: "1+1", unitNumber: 12 },
  { courseCode: "VPT 513", title: "Fundamentals of Pharmacokinetics", creditHours: "1+1", unitNumber: 13 },
];

async function main() {
  console.log("Adding MVSc Veterinary Pharmacology and Toxicology courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Pharmacology and Toxicology",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Pharmacology and Toxicology subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of pharmacologyCourses) {
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

  console.log(`Added ${pharmacologyCourses.length} courses to Veterinary Pharmacology and Toxicology (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
