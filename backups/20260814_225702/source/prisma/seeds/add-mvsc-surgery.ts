import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const surgeryCourses = [
  { courseCode: "VSR 501", title: "Clinical Practice-I*", creditHours: "0+3", unitNumber: 1 },
  { courseCode: "VSR 502", title: "Clinical Practice-II*", creditHours: "0+3", unitNumber: 2 },
  { courseCode: "VSR 503", title: "Principles of Surgery*", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "VSR 504", title: "Anaesthesia And Analgesia*", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VSR 505", title: "Diagnostic Imaging Techniques*", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "VSR 506", title: "Soft Tissue Surgery", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "VSR 507", title: "Orthopaedic Surgery*", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "VSR 508", title: "Anaesthesia of Zoo, Wild, Exotic and Laboratory Animals", creditHours: "1+1", unitNumber: 8 },
  { courseCode: "VSR 509", title: "Urogenital Surgery", creditHours: "1+1", unitNumber: 9 },
  { courseCode: "VSR 510", title: "Ophthalmology", creditHours: "1+1", unitNumber: 10 },
  { courseCode: "VSR 511", title: "Dentistry and Oral Surgery", creditHours: "1+1", unitNumber: 11 },
  { courseCode: "VSR 512", title: "Camel Surgery", creditHours: "1+1", unitNumber: 12 },
  { courseCode: "VSR 513", title: "Elephant Surgery", creditHours: "1+1", unitNumber: 13 },
  { courseCode: "VSR 587", title: "Clinical Case Conference", creditHours: "0+1", unitNumber: 14 },
  { courseCode: "VSR 588", title: "Special Problem in Radiology", creditHours: "0+2", unitNumber: 15 },
  { courseCode: "VSR 589", title: "Special Problem in Anaesthesia", creditHours: "0+2", unitNumber: 16 },
  { courseCode: "VSR 590", title: "Special Problem in Surgery", creditHours: "0+2", unitNumber: 17 },
];

async function main() {
  console.log("Adding MVSc Veterinary Surgery and Radiology courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Surgery and Radiology",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Surgery and Radiology subject not found in MVSc!");
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

  console.log(`Added ${surgeryCourses.length} courses to Veterinary Surgery and Radiology (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
