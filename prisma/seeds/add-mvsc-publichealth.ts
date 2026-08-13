import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const publicHealthCourses = [
  { courseCode: "VPE 501", title: "Concepts in Veterinary Public Health and One Health*", creditHours: "2+0", unitNumber: 1 },
  { courseCode: "VPE 502", title: "Zoonoses-I*", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "VPE 503", title: "Zoonoses-II*", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "VPE 504", title: "Principles of Epidemiology*", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VPE 505", title: "Hygiene and Safety of Foods of Animal and Aquatic Origin*", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "VPE 506", title: "Food-borne Infections and Intoxications", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "VPE 507", title: "Food Safety Standards, and Regulations", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "VPE 508", title: "Environmental Hygiene and Safety", creditHours: "2+1", unitNumber: 8 },
  { courseCode: "VPE 509", title: "Applied Epidemiology", creditHours: "2+1", unitNumber: 9 },
  { courseCode: "VPE 510", title: "Biosecurity, Bioterrorism and Disaster Management", creditHours: "2+0", unitNumber: 10 },
  { courseCode: "VPE 511", title: "Laboratory Techniques in Veterinary Public Health*", creditHours: "0+3", unitNumber: 11 },
];

async function main() {
  console.log("Adding MVSc Veterinary Public Health and Epidemiology courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Public Health and Epidemiology",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Public Health and Epidemiology subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of publicHealthCourses) {
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

  console.log(`Added ${publicHealthCourses.length} courses to Veterinary Public Health and Epidemiology (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
