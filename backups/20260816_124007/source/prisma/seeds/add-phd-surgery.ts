import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const surgeryCourses = [
  { courseCode: "VSR 601", title: "Clinical Practice-I*", creditHours: "0+2", unitNumber: 1 },
  { courseCode: "VSR 602", title: "Clinical Practice-II*", creditHours: "0+2", unitNumber: 2 },
  { courseCode: "VSR 603", title: "Clinical Practice-III*", creditHours: "0+2", unitNumber: 3 },
  { courseCode: "VSR 604", title: "Cardiovascular Surgery", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VSR 605", title: "Advances in Anaesthesiology", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "VSR 606", title: "Advances in Radiology", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "VSR 607", title: "Advances in Diagnostic Imaging Techniques", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "VSR 608", title: "Advances in Orthopaedics", creditHours: "2+1", unitNumber: 8 },
  { courseCode: "VSR 609", title: "Neurosurgery", creditHours: "2+1", unitNumber: 9 },
  { courseCode: "VSR 610", title: "Reconstructive and Regenerative Surgery", creditHours: "1+1", unitNumber: 10 },
  { courseCode: "VSR 611", title: "Advances in Soft Tissue Surgery", creditHours: "2+1", unitNumber: 11 },
  { courseCode: "VSR 612", title: "Advances in Ophthalmology", creditHours: "1+1", unitNumber: 12 },
  { courseCode: "VSR 613", title: "Surgical Oncology", creditHours: "1+1", unitNumber: 13 },
  { courseCode: "VSR 687", title: "Clinical Case Conference*", creditHours: "0+1", unitNumber: 14 },
  { courseCode: "VSR 688", title: "Special Problem in Diagnostic Imaging", creditHours: "0+2", unitNumber: 15 },
  { courseCode: "VSR 689", title: "Special Problem in Anaesthesia", creditHours: "0+2", unitNumber: 16 },
  { courseCode: "VSR 690", title: "Special Problem in Surgery", creditHours: "0+2", unitNumber: 17 },
];

async function main() {
  console.log("Adding PhD Veterinary Surgery and Radiology courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Surgery and Radiology",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Surgery and Radiology subject not found in PhD!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of surgeryCourses) {
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

  console.log(`Added ${surgeryCourses.length} courses to Veterinary Surgery and Radiology (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
