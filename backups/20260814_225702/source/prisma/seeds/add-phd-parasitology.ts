import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const parasitologyCourses = [
  { courseCode: "VPA 601", title: "Advances in Helminthology-I", creditHours: "2+1", unitNumber: 1 },
  { courseCode: "VPA 602", title: "Advances in Helminthology-II", creditHours: "2+1", unitNumber: 2 },
  { courseCode: "VPA 603", title: "Entomology and Acarology", creditHours: "2+1", unitNumber: 3 },
  { courseCode: "VPA 604", title: "Advances in Protozoology", creditHours: "2+1", unitNumber: 4 },
  { courseCode: "VPA 605", title: "Immunology of Parasitic Diseases*", creditHours: "1+2", unitNumber: 5 },
  { courseCode: "VPA 606", title: "Molecular Diagnostics and Vaccine Development in Parasitology*", creditHours: "2+1", unitNumber: 6 },
  { courseCode: "VPA 607", title: "Host Parasite Interactions", creditHours: "2+0", unitNumber: 7 },
  { courseCode: "VPA 608", title: "In-vitro Cultivation of Parasites", creditHours: "1+2", unitNumber: 8 },
  { courseCode: "VPA 609", title: "Emerging and Re-Emerging Parasitic Diseases", creditHours: "2+0", unitNumber: 9 },
  { courseCode: "VPA 610", title: "Biology and Ecology of Parasites", creditHours: "3+0", unitNumber: 10 },
  { courseCode: "VPA 611", title: "Molecular Veterinary Parasitology", creditHours: "2+0", unitNumber: 11 },
  { courseCode: "VPA 612", title: "Parasite Epidemiology*", creditHours: "2+0", unitNumber: 12 },
  { courseCode: "VPA 690", title: "Special Problem", creditHours: "0+1", unitNumber: 13 },
];

async function main() {
  console.log("Adding PhD Veterinary Parasitology courses...");

  const phd = await prisma.programme.findFirst({
    where: { name: "PHD" },
  });

  if (!phd) {
    console.error("PhD programme not found!");
    return;
  }

  const subject = await prisma.subject.findFirst({
    where: {
      name: "Veterinary Parasitology",
      programmeId: phd.id,
    },
  });

  if (!subject) {
    console.error("Veterinary Parasitology subject not found in PhD!");
    return;
  }

  await prisma.chapter.deleteMany({
    where: { subjectId: subject.id },
  });

  for (const course of parasitologyCourses) {
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

  console.log(`Added ${parasitologyCourses.length} courses to Veterinary Parasitology (PhD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
