import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const tests = await prisma.mockTest.findMany({
  where: { title: { contains: "ICAR" } },
  include: { questions: { orderBy: { createdAt: "asc" } } },
  orderBy: { year: "asc" },
});

for (const test of tests.slice(0,3)) {
  console.log(`\n=== SAMPLE ${test.title} [${test.year}] ===`);
  for (let i=0;i<Math.min(5, test.questions.length);i++) {
    const q = test.questions[i];
    console.log(`\n--- Q ${i+1} id ${q.id.slice(-6)} ---`);
    console.log(JSON.stringify(q.text));
    console.log("lines:", q.text.split("\n").map(s=>JSON.stringify(s)));
    console.log("options:", q.options.slice(0,100));
  }
}

// Also check VO 2019
const vo = await prisma.mockTest.findFirst({ where: { title: { contains: "VO-2019" } }, include: { questions: { orderBy: { createdAt: "asc" } } } });
if (vo) {
  console.log(`\n=== VO SAMPLE ${vo.title} ===`);
  for (let i=0;i<3;i++) {
    const q = vo.questions[i];
    console.log(`\n--- VO Q ${i+1} ---`);
    console.log(JSON.stringify(q.text.slice(0,800)));
    console.log("lines:", q.text.split("\n").slice(0,6).map(s=>JSON.stringify(s)));
  }
}

// Check for leading whitespace / newline / BOM issues across all
const all = await prisma.mockTest.findMany({ include: { questions: true } });
let leadingNewline = 0, leadingSpace = 0, bom = 0, emptyFirstLine = 0, isolatedNumberLine = 0;
let examples = [];
for (const t of all) {
  for (const q of t.questions) {
    if (q.text.startsWith("\n") || q.text.startsWith("\r")) { leadingNewline++; if(examples.length<5) examples.push({type:"leadingNewline", title:t.title, preview: JSON.stringify(q.text.slice(0,120))}); }
    else if (q.text.startsWith(" ") || q.text.startsWith("\t")) { leadingSpace++; }
    if (q.text.charCodeAt(0)===65279) bom++;
    const lines = q.text.split("\n");
    if (lines[0].trim()==="" && lines.length>1) emptyFirstLine++;
    if (/^\s*\d+[\.\)]\s*$/.test(lines[0])) isolatedNumberLine++;
  }
}
console.log(`\n=== GLOBAL CHECK ===`);
console.log(`leadingNewline: ${leadingNewline}, leadingSpace: ${leadingSpace}, bom: ${bom}, emptyFirstLine: ${emptyFirstLine}, isolatedNumberLineDET: ${isolatedNumberLine}`);
console.log("examples", examples);

await prisma.$disconnect();
