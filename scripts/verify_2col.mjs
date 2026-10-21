import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const test = await prisma.mockTest.findFirst({ where: { title: "ICAR AIEEA PG 2023 Veterinary Science" }, include: { questions: { orderBy: { createdAt: "asc" } } } });
const listQs = [3,6,11,14,27,33,37,51,52,53,71,72,73,90,97,104,107,111];
console.log("Checking 2-column format for List Qs:");
let ok=0;
for(const n of listQs){
  const q = test.questions[n-1];
  const lines = q.text.split("\n");
  const hasArrow = q.text.includes("→");
  const headerLine = lines.find(l=> l.includes("List I") && l.includes("→"));
  const arrowRows = lines.filter(l=> l.includes("→") && /^(A|B|C|D)\./.test(l.trim()));
  console.log(`Q${n}: hasArrow=${hasArrow} header=${!!headerLine} arrowRows=${arrowRows.length} ${headerLine?headerLine.slice(0,60):''}`);
  if(hasArrow && headerLine && arrowRows.length===4) ok++;
  else console.log("  FAIL lines:", lines.slice(0,6));
}
console.log(`\n2-col OK: ${ok}/${listQs.length}`);
if(ok===listQs.length) console.log("All List Qs are 2-column!");
// Also verify non-List Qs not using →
const nonListWithArrow = test.questions.filter((q,i)=> !listQs.includes(i+1) && q.text.includes("→"));
console.log(`Non-List Qs with → (should be 0-1): ${nonListWithArrow.length}`);
if(nonListWithArrow.length>0) {
  for(const q of nonListWithArrow.slice(0,3)) console.log(`Q${test.questions.indexOf(q)+1} has →: ${q.text.slice(0,100)}`);
}
await prisma.$disconnect();
