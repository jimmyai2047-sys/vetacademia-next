import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const publicHealthCourses = [
  { courseCode: "VPE 601", title: "Advances in Veterinary Public Health and Epidemiology*", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "VPE 602", title: "Emerging, Re-emerging Zoonoses and One Health*", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "VPE 603", title: "Advances in Food Safety and Quality Control of Foods of Animal/ Aquatic origin*", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "VPE 604", title: "Biosecurity and Occupational Health Safety", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VPE 605", title: "Recent Concepts in Epidemiology and Disease Forecasting", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "VPE 606", title: "Risk Analysis and Predictive Modelling", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "VPE 607", title: "Advances in Environmental Hygiene", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "VPE 608", title: "Herd Health Management and Disease Economics", creditHours: "2+1", unitNumber: 8 },
  { courseCode: "VPE 609", title: "Epidemiology of Trans-boundary, Non-infectious and Chronic diseases", creditHours: "2+1", unitNumber: 9 },
  { courseCode: "VPE 610", title: "Ecology and Animal/ Human Health", creditHours: "2+0", unitNumber: 10 },
  { courseCode: "VPE 611", title: "Diagnostic Approaches in Epidemiology", creditHours: "2+1", unitNumber: 11 },
  { courseCode: "VPE 612", title: "Surveys, Surveillance and Data Management", creditHours: "2+1", unitNumber: 12 },
  { courseCode: "VPE 613", title: "Research Methodology and Publication Ethics in VPE*", creditHours: "2+0", unitNumber: 13 },
  { courseCode: "VPE 690", title: "Special Problem", creditHours: "0+1", unitNumber: 14 },
];

async function main() {
  console.log("Adding PhD Veterinary Public Health and Epidemiology courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Public Health and Epidemiology",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Public Health and Epidemiology subject not found in PhD!");
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

  console.log(`Added ${publicHealthCourses.length} courses to Veterinary Public Health and Epidemiology (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
