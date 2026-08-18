import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const medicineCourses = [
  { courseCode: "VMD 601", title: "Farm Animal Gastroenterology", creditHours: "2+0", unitNumber: 1 },
  { courseCode: "VMD 602", title: "Farm Animal Cardiopulmonary and Urinary System Diseases", creditHours: "2+0", unitNumber: 2 },
  { courseCode: "VMD 603", title: "Farm Animal Neurological and Musculo-skeletal System Diseases", creditHours: "1+0", unitNumber: 3 },
  { courseCode: "VMD 604", title: "Farm Animal Neonatology", creditHours: "1+0", unitNumber: 4 },
  { courseCode: "VMD 605", title: "Herd Health Management", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "VMD 606", title: "Canine and Feline Gastroenterology", creditHours: "2+0", unitNumber: 6 },
  { courseCode: "VMD 607", title: "Advances in Neurological and Musculoskeletal System Diseases of Canine and Feline", creditHours: "1+0", unitNumber: 7 },
  { courseCode: "VMD 608", title: "Canine and Feline Cardiopulmonary and Urinary System Diseases", creditHours: "1+0", unitNumber: 8 },
  { courseCode: "VMD 609", title: "Dermatology and Endocrinology", creditHours: "1+0", unitNumber: 9 },
  { courseCode: "VMD 610", title: "Canine and Feline Eye and Ear Diseases", creditHours: "1+0", unitNumber: 10 },
  { courseCode: "VMD 611", title: "Veterinary Diagnostics", creditHours: "0+2", unitNumber: 11 },
  { courseCode: "VMD 612", title: "Metabolic and Nutritional Deficiency Diseases", creditHours: "2+0", unitNumber: 12 },
  { courseCode: "VMD 613", title: "Emergency and Critical Care Medicine", creditHours: "1+1", unitNumber: 13 },
  { courseCode: "VMD 614", title: "Emerging and Re-emerging Animal Diseases", creditHours: "2+0", unitNumber: 14 },
  { courseCode: "VMD 615", title: "Prevention and Control of Infectious Diseases of Ruminants", creditHours: "2+0", unitNumber: 15 },
  { courseCode: "VMD 616", title: "Clinical Practice-I", creditHours: "0+2", unitNumber: 16 },
  { courseCode: "VMD 617", title: "Clinical Practice-II", creditHours: "0+2", unitNumber: 17 },
  { courseCode: "VMD 618", title: "Clinical Practice-III", creditHours: "0+2", unitNumber: 18 },
];

async function main() {
  console.log("Adding PhD Veterinary Medicine courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Medicine",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Medicine subject not found in PhD!");
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

  console.log(`Added ${medicineCourses.length} courses to Veterinary Medicine (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
