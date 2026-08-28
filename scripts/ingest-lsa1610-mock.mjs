import "dotenv/config";
import fs from "fs";
import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";

const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\State Public Service Commission\\Livestock Assistant (L.S.A.)\\Previous Year Papers (PYP)\\LSA-16-10-2016_Question_with_Answer_Key_Explaination_Bilingual.docx";
const TITLE = "Livestock Assistant (L.S.A.) Previous Year Paper 2016 (16 October 2016) — TSP (Code 22)";
const TRACK = "livestock-assistant";
const EXAM = "psc";
const YEAR = "2016";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// check existing MockTest
let existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
if (existing) {
  console.log(`MockTest already exists [${existing.id}] ${TITLE} — skipping.`);
  await prisma.$disconnect();
  process.exit(0);
}

console.log("Parsing docx...");
const { value } = await mammoth.extractRawText({ path: DOCX_PATH });
const txt = value.replace(/\r/g,"");
const re = /Q(\d+)\.\s+([\s\S]*?)\s+\(1\)\s*([^\n✔✓]+?)\s*(?:[✔✓])?\s+\(2\)\s*([^\n✔✓]+?)\s*(?:[✔✓])?\s+\(3\)\s*([^\n✔✓]+?)\s*(?:[✔✓])?\s+\(4\)\s*([^\n✔✓]+?)\s*(?:[✔✓])?\s+प्रश्न\s+\1\.\s+([\s\S]*?)\s+\(1\)\s*([^\n✔✓]+?)\s*(?:[✔✓])?\s+\(2\)\s*([^\n✔✓]+?)\s*(?:[✔✓])?\s+\(3\)\s*([^\n✔✓]+?)\s*(?:[✔✓])?\s+\(4\)\s*([^\n✔✓]+?)\s*(?:[✔✓])?\s+सही उत्तर\s*\/\s*Correct Answer:\s*\((\d+)\)[^\n]*\s+व्याख्या:\s*([\s\S]*?)(?=\s*Q\d+\.|$)/g;
const parsed = [];
let m;
while ((m = re.exec(txt)) !== null) {
  parsed.push({
    qno: parseInt(m[1],10),
    enQ: m[2].trim(),
    enOpts: [m[3].trim(), m[4].trim(), m[5].trim(), m[6].trim()],
    hiQ: m[7].trim(),
    hiOpts: [m[8].trim(), m[9].trim(), m[10].trim(), m[11].trim()],
    correct: parseInt(m[12],10)-1,
    explanation: m[13].trim(),
  });
}
console.log(`Parsed ${parsed.length} questions`);
if (parsed.length === 0) { console.error("No questions parsed"); await prisma.$disconnect(); process.exit(1); }
parsed.sort((a,b)=>a.qno-b.qno);
console.log(parsed.slice(0,2).map(p=>`Q${p.qno} ans=${p.correct+1} hiQ=${p.hiQ.slice(0,30)}`));

const test = await prisma.mockTest.create({
  data: {
    title: TITLE,
    description: `LSA 2016 (16 Oct, TSP Code 22) previous year paper — bilingual with answer key and explanation. ${parsed.length} questions.`,
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

const rows = parsed.map(p => {
  const questionText = `${p.hiQ}\n${p.enQ}`;
  const opts = p.hiOpts.map((hi, i) => {
    const en = p.enOpts[i];
    return hi.trim() === en.trim() ? hi.trim() : `${hi} / ${en}`;
  });
  return {
    text: normalize(questionText, "\n"),
    options: JSON.stringify(opts.map(o=>normalize(o, " / ")).map(o=>{
      const parts = o.split(" / ").map(s=>s.trim());
      return parts.length===2 && parts[0]===parts[1] ? parts[0] : o;
    })),
    correctAnswer: p.correct,
    marks: 1,
    difficulty: 2,
    explanation: p.explanation,
    mockTestId: test.id,
  };
});
await prisma.question.createMany({ data: rows });
console.log(`Ingested ${rows.length} questions with answer key & explanation.`);
await prisma.$disconnect();
