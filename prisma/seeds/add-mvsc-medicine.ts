import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const medicineCourses = [
  { courseCode: "VMD 501*", title: "Ruminant Medicine-internal", creditHours: "3+0", unitNumber: 1 },
  { courseCode: "VMD 502*", title: "Ruminant Medicine-infectious", creditHours: "3+0", unitNumber: 2 },
  { courseCode: "VMD 503", title: "Equine Medicine", creditHours: "2+0", unitNumber: 3 },
  { courseCode: "VMD 504*", title: "Canine and Feline Medicine-I", creditHours: "2+0", unitNumber: 4 },
  { courseCode: "VMD 505*", title: "Canine and Feline Medicine-II", creditHours: "2+0", unitNumber: 5 },
  { courseCode: "VMD 506", title: "Metabolic and Endocrine Diseases, Nutritional Deficiencies and Diseases of Mammary Gland", creditHours: "2+0", unitNumber: 6 },
  { courseCode: "VMD 507", title: "Paediatrics and Geriatrics", creditHours: "2+0", unitNumber: 7 },
  { courseCode: "VMD 508", title: "Avian and Swine Medicine", creditHours: "2+0", unitNumber: 8 },
  { courseCode: "VMD 509", title: "Zoo, Wild and Laboratory Animal Medicine", creditHours: "1+0", unitNumber: 9 },
  { courseCode: "VMD 510", title: "Toxicology and Forensic Medicine", creditHours: "1+0", unitNumber: 10 },
  { courseCode: "VMD 511*", title: "Clinical Diagnostic Techniques", creditHours: "0+2", unitNumber: 11 },
  { courseCode: "VMD 512", title: "Emergency Medicine", creditHours: "0+2", unitNumber: 12 },
  { courseCode: "VMD 513*", title: "Diagnosis of Veterinary Infectious Diseases", creditHours: "0+1", unitNumber: 13 },
  { courseCode: "VMD 514", title: "Oncology and Ethno-veterinary Medicine", creditHours: "1+0", unitNumber: 14 },
  { courseCode: "VMD 515", title: "Animal Disease Investigation and Biosecurity", creditHours: "1+1", unitNumber: 15 },
  { courseCode: "VMD 516*", title: "Clinical Practice-I", creditHours: "0+3", unitNumber: 16 },
  { courseCode: "VMD 517*", title: "Clinical Practice-II", creditHours: "0+3", unitNumber: 17 },
];

async function main() {
  console.log("Adding MVSc Veterinary Medicine courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Medicine",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Medicine subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of medicineCourses) {
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

  console.log(`Added ${medicineCourses.length} courses to Veterinary Medicine (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
