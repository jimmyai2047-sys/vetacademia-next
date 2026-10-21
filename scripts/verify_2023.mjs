import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const test = await prisma.mockTest.findFirst({ where: { title: "ICAR AIEEA PG 2023 Veterinary Science" }, include: { questions: { orderBy: { createdAt: "asc" } } } });
console.log(`Test: ${test.title} ${test.id} ${test.questions.length} qs`);
for(const q of test.questions.slice(0,5)) {
  console.log(`\n--- Q text ---\n${q.text.slice(0,500)}\n opts=${JSON.parse(q.options).slice(0,2)} correct=${q.correctAnswer} exp=${(q.explanation||'').slice(0,80)}`);
}
const q3 = test.questions[2];
console.log("\n=== Q3 full ===");
console.log(q3.text);
console.log("opts", JSON.parse(q3.options));
const q4 = test.questions[3];
console.log("\n=== Q4 full ===");
console.log(q4.text);
const q28 = test.questions[27];
console.log("\n=== Q28 full ===");
console.log(q28.text);
await prisma.$disconnect();
