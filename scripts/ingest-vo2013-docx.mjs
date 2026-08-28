import "dotenv/config";
import fs from "fs";
import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";

const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\State Public Service Commission\\Veterinary Officer (V.O.)\\Previous Year Papers\\VO_2013_Question_Paper_with_Answer_Key_CrossChecked.docx";
const TITLE = "Veterinary Officer (V.O.) Previous Year Paper 2013";
const TRACK = "veterinary-officer";
const EXAM = "psc";
const YEAR = "2013";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// check existing MockTest
let existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
if (existing) {
  console.log(`MockTest already exists [${existing.id}] ${TITLE} — skipping. Delete it first to re-ingest.`);
  await prisma.$disconnect();
  process.exit(0);
}

console.log("Parsing docx...");
const { value } = await mammoth.extractRawText({ path: DOCX_PATH });
const txt = value.replace(/\r/g,"");
const re = /Q\.(\d+)\.\s+([\s\S]*?)\s+\(1\)\s*([^\n✔]+?)\s*(?:✔)?\s+\(2\)\s*([^\n✔]+?)\s*(?:✔)?\s+\(3\)\s*([^\n✔]+?)\s*(?:✔)?\s+\(4\)\s*([^\n✔]+?)\s*(?:✔)?\s+Correct Answer:\s*\((\d+)\)[^\n]*\s+Explanation:\s*([\s\S]*?)(?=\s*Q\.\d+\.|$)/g;
const parsed = [];
let m;
while ((m = re.exec(txt)) !== null) {
  parsed.push({
    qno: parseInt(m[1],10),
    question: m[2].trim(),
    opts: [m[3].trim(), m[4].trim(), m[5].trim(), m[6].trim()],
    correct: parseInt(m[7],10)-1,
    explanation: m[8].trim(),
  });
}
console.log(`Parsed ${parsed.length} questions from docx`);
if (parsed.length === 0) { console.error("No questions parsed — check format"); await prisma.$disconnect(); process.exit(1); }
parsed.sort((a,b)=>a.qno-b.qno);
// quick sample
console.log(parsed.slice(0,2).map(p=>`Q${p.qno} ans=${p.correct+1} ${p.question.slice(0,50)}`));

const test = await prisma.mockTest.create({
  data: {
    title: TITLE,
    description: `VO 2013 previous year paper with answer key and explanation. ${parsed.length} questions.`,
    duration: 120,
    totalMarks: parsed.length,
    exam: EXAM,
    track: TRACK,
    kind: "PREVIOUS_YEAR",
    year: YEAR,
    isDemo: false,
  },
});
console.log(`Created MockTest ${test.id}`);

const rows = parsed.map(p => ({
  text: normalize(p.question, "\n"),
  options: JSON.stringify(p.opts.map(o=>normalize(o, " / "))),
  correctAnswer: p.correct,
  marks: 1,
  difficulty: 2,
  explanation: p.explanation,
  mockTestId: test.id,
}));
await prisma.question.createMany({ data: rows });
console.log(`Ingested ${rows.length} questions with answer key & explanation.`);
await prisma.$disconnect();
