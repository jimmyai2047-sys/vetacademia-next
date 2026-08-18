import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const geneticsCourses = [
  { courseCode: "AGB 601*", title: "Animal Cytogenetics and Immunogenetics I", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "AGB 602*", title: "Molecular Genetics I", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "AGB 603*", title: "Population and Quantitative Genetics", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "AGB 604*", title: "Selection Method and Breeding System", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "AGB 605*", title: "Biometrical Genetics I", creditHours: "2+1", unitNumber: 5 },
  { courseCode: "AGB 606", title: "Conservation of Animal Genetics Resources", creditHours: "2+0", unitNumber: 6 },
  { courseCode: "AGB 607", title: "Cattle and Buffalo Breeding", creditHours: "2+1", unitNumber: 7 },
  { courseCode: "AGB 608", title: "Sheep and Goat Breeding", creditHours: "2+0", unitNumber: 8 },
  { courseCode: "AGB 609", title: "Poultry Breeding", creditHours: "2+1", unitNumber: 9 },
  { courseCode: "AGB 610*", title: "Laboratory Animal and Rabbit Breeding", creditHours: "2+0", unitNumber: 10 },
  { courseCode: "AGB 611", title: "Swine Breeding", creditHours: "1+0", unitNumber: 11 },
  { courseCode: "AGB 612", title: "Pet Animal Breeding (Dogs and Cats)", creditHours: "1+0", unitNumber: 12 },
  { courseCode: "AGB 613", title: "Wild Animal Genetics and Breeding", creditHours: "1+0", unitNumber: 13 },
  { courseCode: "AGB 614", title: "Equine Breeding", creditHours: "1+0", unitNumber: 14 },
  { courseCode: "AGB 615", title: "Camel Breeding", creditHours: "1+0", unitNumber: 15 },
  { courseCode: "AGB 616", title: "Yak and Mithun Breeding", creditHours: "1+0", unitNumber: 16 },
  { courseCode: "AGB 617", title: "Statistical Methods in Animal Breeding", creditHours: "2+1", unitNumber: 17 },
];

async function main() {
  console.log("Adding MVSc Animal Genetics and Breeding courses...");

  const mvsc = await prisma.programme.findFirst({
    where: { name: "MVSC" },
  });

  if (!mvsc) {
    console.error("MVSc programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Animal Genetics and Breeding",
      programmeId: mvsc.id,
    },
  });

  if (!subject) {
    console.error("Animal Genetics and Breeding subject not found in MVSc!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of geneticsCourses) {
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

  console.log(`Added ${geneticsCourses.length} courses to Animal Genetics and Breeding (MVSc)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
