import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const test = await prisma.mockTest.findFirst({ where: { title: "ICAR AIEEA PG 2023 Veterinary Science" }, include: { questions: { orderBy: { createdAt: "asc" } } } });
const flagged = [14,33,51,52,53,71,72,73,97,104,107,111];
for(const n of flagged){
  const q = test.questions[n-1];
  console.log(`\n=== Q${n} ===`);
  console.log(q.text.slice(0,400));
  console.log("Has List I:", q.text.includes("List"));
  console.log("Lines:", q.text.split("\n").slice(0,8));
}
await prisma.$disconnect();
