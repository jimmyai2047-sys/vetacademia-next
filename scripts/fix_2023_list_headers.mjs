import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const test = await prisma.mockTest.findFirst({ where: { title: "ICAR AIEEA PG 2023 Veterinary Science" }, include: { questions: { orderBy: { createdAt: "asc" } } } });
console.log(`Fixing List headers for ${test.title}`);

let fixed = 0;
for (const q of test.questions) {
  let orig = q.text;
  let updated = orig
    .replace(/List-I:/g, "List I:")
    .replace(/List-II:/g, "List II:")
    .replace(/List–I:/g, "List I:")
    .replace(/List–II:/g, "List II:")
    .replace(/List–I\s/g, "List I ")
    .replace(/List–II\s/g, "List II ");
  // Also ensure "Match List-I with List-II" -> "Match List I with List II"
  updated = updated.replace(/Match List-I with List-II/g, "Match List I with List II");
  updated = updated.replace(/Match List–I with List–II/g, "Match List I with List II");
  if (updated !== orig) {
    await prisma.question.update({ where: { id: q.id }, data: { text: updated } });
    console.log(`Fixed Q${test.questions.indexOf(q)+1}`);
    fixed++;
  }
}
console.log(`Fixed ${fixed} questions`);
await prisma.$disconnect();
