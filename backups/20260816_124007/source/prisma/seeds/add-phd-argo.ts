import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const argoCourses = [
  { courseCode: "VGO 601", title: "Advances in Gynaecology and Infertility Management*", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "VGO 602", title: "Advances in Veterinary Obstetrics", creditHours: "1+1", unitNumber: 2 },
  { courseCode: "VGO 603", title: "Advances in Andrology and Male Infertility*", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "VGO 604", title: "Reproductive Biotechnology", creditHours: "1+1", unitNumber: 4 },
  { courseCode: "VGO 605", title: "Semenology", creditHours: "1+1", unitNumber: 5 },
  { courseCode: "VGO 606", title: "Clinical Practice-I*", creditHours: "0+3", unitNumber: 6 },
  { courseCode: "VGO 607", title: "Clinical Practice-II*", creditHours: "0+3", unitNumber: 7 },
  { courseCode: "VGO 690", title: "Special Problem", creditHours: "0+2", unitNumber: 8 },
];

async function main() {
  console.log("Adding PhD Animal Reproduction Gynaecology and Obstetrics courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Animal Reproduction Gynaecology and Obstetrics",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Animal Reproduction Gynaecology and Obstetrics subject not found in PhD!");
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

  console.log(`Added ${argoCourses.length} courses to Animal Reproduction Gynaecology and Obstetrics (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
