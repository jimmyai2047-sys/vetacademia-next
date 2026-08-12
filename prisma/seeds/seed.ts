import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create programmes
  const ahdp = await prisma.programme.create({
    data: {
      name: "AHDP",
      fullName: "Animal Husbandry Diploma Programme",
      yearType: "semester",
      icon: "BookOpen",
    },
  });

  const bvsc = await prisma.programme.create({
    data: {
      name: "BVSC",
      fullName: "Bachelor of Veterinary Science & Animal Husbandry",
      yearType: "year",
      icon: "GraduationCap",
    },
  });

  const mvsc = await prisma.programme.create({
    data: {
      name: "MVSC",
      fullName: "Master of Veterinary Science",
      yearType: "department",
      icon: "FlaskConical",
    },
  });

  const phd = await prisma.programme.create({
    data: {
      name: "PHD",
      fullName: "Doctor of Philosophy in Veterinary Science",
      yearType: "department",
      icon: "Stethoscope",
    },
  });

  console.log("Programmes created!");

  // Create AHDP subjects
  const ahdpSubjects = [
    { code: "VAN-101", name: "Veterinary Anatomy", year: "1st Year", semester: "1st Semester" },
    { code: "VPH-101", name: "Veterinary Physiology", year: "1st Year", semester: "1st Semester" },
    { code: "VAM-201", name: "Introductory Animal Management", year: "1st Year", semester: "2nd Semester" },
    { code: "VAN-201", name: "Introductory Animal Nutrition", year: "2nd Year", semester: "3rd Semester" },
    { code: "AB-201", name: "Animal Breeding", year: "2nd Year", semester: "3rd Semester" },
    { code: "VRE-201", name: "Animal Reproduction", year: "2nd Year", semester: "4th Semester" },
    { code: "VPH-201", name: "Veterinary Pharmacology", year: "2nd Year", semester: "4th Semester" },
    { code: "VME-201", name: "Introductory Veterinary Medicine", year: "2nd Year", semester: "4th Semester" },
    { code: "VSU-201", name: "Minor Veterinary Surgery", year: "2nd Year", semester: "4th Semester" },
    { code: "VPM-201", name: "Preventive Medicine", year: "2nd Year", semester: "4th Semester" },
    { code: "AHE-201", name: "Animal Husbandry Extension Education", year: "2nd Year", semester: "4th Semester" },
  ];

  for (const subject of ahdpSubjects) {
    await prisma.subject.create({
      data: { ...subject, programmeId: ahdp.id },
    });
  }

  // Create BVSc subjects
  const bvscSubjects = [
    { code: "VAN-301", name: "Veterinary Anatomy", year: "1st Year", paper: "1st Paper" },
    { code: "VPH-301", name: "Veterinary Physiology", year: "1st Year", paper: "1st Paper" },
    { code: "VBC-401", name: "Veterinary Biochemistry", year: "2nd Year", paper: "1st Paper" },
    { code: "VPA-401", name: "Veterinary Pathology", year: "2nd Year", paper: "2nd Paper" },
    { code: "VMI-401", name: "Veterinary Microbiology", year: "2nd Year", paper: "2nd Paper" },
    { code: "VPA-501", name: "Veterinary Parasitology", year: "3rd Year", paper: "1st Paper" },
    { code: "VPH-501", name: "Veterinary Pharmacology", year: "3rd Year", paper: "1st Paper" },
    { code: "VPH-502", name: "Veterinary Public Health", year: "3rd Year", paper: "2nd Paper" },
    { code: "VME-601", name: "Veterinary Medicine", year: "4th Year", paper: "1st Paper" },
    { code: "VSU-601", name: "Veterinary Surgery", year: "4th Year", paper: "2nd Paper" },
    { code: "VGO-601", name: "Veterinary Gynaecology & Obstetrics", year: "4th Year", paper: "2nd Paper" },
    { code: "VCP-601", name: "Veterinary Clinical Practices", year: "4th Year", paper: "3rd Paper" },
  ];

  for (const subject of bvscSubjects) {
    await prisma.subject.create({
      data: { ...subject, programmeId: bvsc.id },
    });
  }

  // Create MVSc departments
  const mvscDepts = [
    "Animal Genetics & Breeding", "Animal Nutrition",
    "Animal Reproduction, Gynaecology & Obstetrics", "Livestock Production & Management",
    "Livestock Products Technology", "Poultry Science", "Veterinary Anatomy",
    "Veterinary Biochemistry", "Veterinary Biotechnology", "Veterinary Extension Education",
    "Veterinary Medicine", "Veterinary Microbiology", "Veterinary Parasitology",
    "Veterinary Pathology", "Veterinary Pharmacology & Toxicology", "Veterinary Physiology",
    "Veterinary Public Health & Epidemiology", "Veterinary Surgery & Radiology",
  ];

  for (const deptName of mvscDepts) {
    await prisma.department.create({ data: { name: deptName, programmeId: mvsc.id } });
  }

  for (const deptName of mvscDepts) {
    await prisma.department.create({ data: { name: deptName, programmeId: phd.id } });
  }

  console.log("Subjects and departments created!");

  // Create demo users
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: { name: "Admin", email: "admin@vetacademia.com", password: hashedPassword, role: "ADMIN" },
  });

  const studentPassword = await bcrypt.hash("student123", 12);
  await prisma.user.create({
    data: {
      name: "Demo Student", email: "student@vetacademia.com",
      password: studentPassword, role: "STUDENT", programme: "BVSC", year: "2nd Year",
    },
  });

  // Create mock test
  const anatomySubject = await prisma.subject.findFirst({ where: { name: "Veterinary Anatomy" } });
  if (anatomySubject) {
    const mockTest = await prisma.mockTest.create({
      data: {
        title: "Veterinary Anatomy - Basic",
        description: "Basic anatomy test for beginners",
        duration: 30,
        totalMarks: 50,
        subjectId: anatomySubject.id,
      },
    });

    const questions = [
      { text: "How many bones are in the human body?", options: JSON.stringify(["106", "206", "306", "406"]), correctAnswer: 1, marks: 1 },
      { text: "Which is the largest organ in the body?", options: JSON.stringify(["Heart", "Liver", "Skin", "Brain"]), correctAnswer: 2, marks: 1 },
      { text: "What is the functional unit of kidney?", options: JSON.stringify(["Neuron", "Nephron", "Alveolus", "Villus"]), correctAnswer: 1, marks: 1 },
    ];

    for (const q of questions) {
      await prisma.question.create({
        data: { ...q, mockTestId: mockTest.id },
      });
    }
    console.log("Mock test created!");
  }

  console.log("Demo users created!");
  console.log("Admin: admin@vetacademia.com / admin123");
  console.log("Student: student@vetacademia.com / student123");
  console.log("Seeding completed!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
