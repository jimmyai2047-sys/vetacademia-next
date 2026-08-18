import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const argoCourses = [
  { courseCode: "VGO 501", title: "General Gynaecology", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "VGO 502", title: "Female Infertility in Farm Animals", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "VGO 503", title: "Veterinary Obstetrics", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "VGO 504", title: "Andrology and Male Infertility", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VGO 505", title: "Semen Preservation and Artificial Insemination", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "VGO 506", title: "Basics of Reproductive Biotechnology", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "VGO 507", title: "Clinical Practice-I", creditHours: "0+3", unitNumber: 7 },
  { courseCode: "VGO 508", title: "Clinical Practice-II", creditHours: "0+3", unitNumber: 8 },
  { courseCode: "VGO 509", title: "Canine and Feline Reproduction", creditHours: "2+1", unitNumber: 9 },
  { courseCode: "VGO 510", title: "Caprine and Ovine Reproduction", creditHours: "2+1", unitNumber: 10 },
  { courseCode: "VGO 511", title: "Equine Reproduction", creditHours: "2+1", unitNumber: 11 },
  { courseCode: "VGO 512", title: "Camel Reproduction", creditHours: "2+1", unitNumber: 12 },
  { courseCode: "VGO 513", title: "Elephant Reproduction", creditHours: "2+1", unitNumber: 13 },
  { courseCode: "VGO 514", title: "Wild and Zoo Animal Reproduction", creditHours: "2+1", unitNumber: 14 },
  { courseCode: "VGO 515", title: "Porcine Reproduction", creditHours: "2+1", unitNumber: 15 },
  { courseCode: "VGO 516", title: "Ultrasonography In Animal Reproduction", creditHours: "1+2", unitNumber: 16 },
  { courseCode: "VGO 590", title: "Special Problem", creditHours: "0+1", unitNumber: 17 },
];

async function main() {
  console.log("Adding MVSc Animal Reproduction Gynaecology and Obstetrics courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Animal Reproduction Gynaecology and Obstetrics",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Animal Reproduction Gynaecology and Obstetrics subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of argoCourses) {
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

  console.log(`Added ${argoCourses.length} courses to Animal Reproduction Gynaecology and Obstetrics (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
