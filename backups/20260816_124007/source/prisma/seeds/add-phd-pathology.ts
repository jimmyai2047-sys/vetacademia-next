import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const pathologyCourses = [
  { courseCode: "VPL 601", title: "Molecular and Ultrastructural Basis of Cell Injury*", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "VPL 602", title: "Molecular Basis of Inflammation", creditHours: "1+1", unitNumber: 2 },
  { courseCode: "VPL 603", title: "Molecular Basis of Neoplasia", creditHours: "1+1", unitNumber: 3 },
  { courseCode: "VPL 604", title: "Immunopathology*", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VPL 605", title: "Advances in Diagnostic Pathology", creditHours: "1+2", unitNumber: 5 },
  { courseCode: "VPL 606", title: "Pathology of Nutritional and Metabolic Disturbances", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "VPL 607", title: "Pathology of Important Emerging and Re-Emerging Diseases of Pets and Livestock", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "VPL 608", title: "Research Methodology in Pathology*", creditHours: "1+0", unitNumber: 8 },
  { courseCode: "VPL 609", title: "Necropsy Conference I*", creditHours: "0+1", unitNumber: 9 },
  { courseCode: "VPL 690", title: "Special Problem", creditHours: "0+1", unitNumber: 10 },
];

async function main() {
  console.log("Adding PhD Veterinary Pathology courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Pathology",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Pathology subject not found in PhD!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of pathologyCourses) {
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

  console.log(`Added ${pathologyCourses.length} courses to Veterinary Pathology (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
