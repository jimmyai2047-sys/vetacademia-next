import "dotenv/config";
import fs from "fs";
import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";

const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\ICAR P.G. Entrance Examination (M.V.Sc & Ph.D.)\\ICAR PG Entrance Examination\\ICAR_AIEEA_PG_2026_Animal_Sciences_Question_Answer_with_Explanation.docx";
const TITLE = "ICAR AIEEA PG 2026 Animal Sciences — Question Paper with Answer & Explanation";
const TRACK = "icar-jrf";
const EXAM = "icar-entrance";
const YEAR = "2026";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

let existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
if (existing) { console.log(`MockTest already exists [${existing.id}] — skipping`); await prisma.$disconnect(); process.exit(0); }

console.log("Parsing ICAR docx...");
const { value } = await mammoth.extractRawText({ path: DOCX_PATH });
let txt = value.replace(/\r/g,"");
let rawLines = txt.split("\n");
let lines = [];
for (const l of rawLines) lines.push(l);
function nextNonEmpty(idx){ while(idx < lines.length && lines[idx].trim()==="") idx++; return idx; }

const parsed=[];
let i=0;
while (i < lines.length) {
  let idx = nextNonEmpty(i);
  if (idx>=lines.length) break;
  const line = lines[idx].trim();
  const m0 = line.match(/^Q\.No\.\s*0*(\d+)\s+(.*)/);
  if (!m0) { i=idx+1; continue; }
  const qno = parseInt(m0[1],10);
  let qText = m0[2].trim();
  let qLines=[qText];
  let cur = idx+1;
  // Collect question text until next line contains "(1)" (options) - may include List lines
  while (cur < lines.length) {
    let lIdx = nextNonEmpty(cur);
    if(lIdx>=lines.length) break;
    const l = lines[lIdx].trim();
    if (/^\(1\)/.test(l) || l.startsWith("Answer:") || /^Q\.No\./.test(l)) break;
    // If line looks like List - I: etc., include
    qLines.push(l);
    cur = lIdx+1;
    let peek = nextNonEmpty(cur);
    if (peek < lines.length && /^\(1\)/.test(lines[peek].trim())) break;
    if (qLines.length>8) break;
  }
  qText = qLines.join("\n").trim();
  // Options: next line(s) should contain "(1) ... (2) ... (3) ... (4) ..."
  let optLineIdx = nextNonEmpty(cur);
  if(optLineIdx>=lines.length) break;
  let optBlock="";
  let optCur = optLineIdx;
  // Collect until Answer:
  while (optCur < lines.length) {
    let lIdx = nextNonEmpty(optCur);
    if(lIdx>=lines.length) break;
    const l = lines[lIdx].trim();
    if (l.startsWith("Answer:")) break;
    if (/^Q\.No\./.test(l)) break;
    optBlock += " " + l;
    optCur = lIdx+1;
    // Check if we have all 4 options
    const hasAll = (optBlock.match(/\(1\)/g)||[]).length>=1 && (optBlock.match(/\(4\)/g)||[]).length>=1;
    if (hasAll) break;
    if (optBlock.length>500) break;
  }
  // Parse options from optBlock
  const optMatches = [...optBlock.matchAll(/\(([1-4])\)\s*([^\(]+?)(?=\s*\([1-4]\)|$)/g)];
  let opts=[];
  for (const mm of optMatches) {
    opts.push(mm[2].trim());
  }
  if(opts.length!==4){
    // Fallback: try alternative parsing where options are on one line with "(1) ... (2) ..."
    const alt = optBlock.split(/\s+(?=\([1-4]\))/);
    if(alt.length>=4){
      opts = alt.map(s=>s.replace(/^\([1-4]\)\s*/,"").trim()).filter(Boolean).slice(0,4);
    }
  }
  if(opts.length!==4){ console.log(`Q${qno} opts parse failed: ${optBlock.slice(0,100)}`); i=optCur; continue; }
  cur = optCur;
  let ansIdx = nextNonEmpty(cur);
  if(ansIdx>=lines.length) break;
  const ansLine = lines[ansIdx].trim();
  const ansM = ansLine.match(/Answer:\s*\(([1-4])\)/);
  if(!ansM){ i=ansIdx+1; continue; }
  const correct = parseInt(ansM[1],10)-1;
  let explanation="";
  const expIdx = ansLine.indexOf("Explanation:");
  if(expIdx!==-1) explanation = ansLine.slice(expIdx+12).trim();
  else {
    let expLineIdx = nextNonEmpty(ansIdx+1);
    if(expLineIdx<lines.length && lines[expLineIdx].trim().startsWith("Explanation:")){
      explanation = lines[expLineIdx].trim().replace(/^Explanation:\s*/,"").trim();
      cur = expLineIdx+1;
    } else {
      cur = ansIdx+1;
    }
  }
  if(expIdx!==-1) cur = ansIdx+1;
  // Explanation may be multi-line until next Q
  let expExtraIdx = nextNonEmpty(cur);
  let extraExp=[];
  let expCur2 = expExtraIdx;
  while(expCur2 < lines.length){
    let lIdx = nextNonEmpty(expCur2);
    if(lIdx>=lines.length) break;
    const l = lines[lIdx].trim();
    if(/^Q\.No\./.test(l)) break;
    if(l.startsWith("Answer:")) break;
    // If line is explanation continuation (not a new Q, not options)
    // For ICAR, explanation is usually single line, but we can collect until next Q
    // If we already have explanation from ansLine, we should not collect more
    break;
  }
  parsed.push({ qno, qText, opts, correct, explanation });
  i = cur;
}
console.log(`Parsed ${parsed.length} questions`);
const missing=[];
for(let n=1;n<=120;n++) if(!parsed.some(p=>p.qno===n)) missing.push(n);
console.log("missing", missing.length, missing.slice(0,10));
if(parsed.length!==120){ console.error("Not 120, abort"); await prisma.$disconnect(); process.exit(1); }
parsed.sort((a,b)=>a.qno-b.qno);
const test = await prisma.mockTest.create({
  data: { title: TITLE, description: `ICAR AIEEA PG 2026 Animal Sciences — 120 questions with answer key and explanation.`, duration: 120, totalMarks: parsed.length, exam: EXAM, track: TRACK, kind: "PREVIOUS_YEAR", year: YEAR, isDemo: false },
});
console.log(`Created MockTest ${test.id}`);
for(let idx=0; idx<parsed.length; idx++){
  const p = parsed[idx];
  await prisma.question.create({
    data: {
      text: normalize(p.qText, "\n"),
      options: JSON.stringify(p.opts.map(o=>normalize(o," / "))),
      correctAnswer: p.correct,
      marks: 1, difficulty: 2, explanation: p.explanation, mockTestId: test.id,
      createdAt: new Date(Date.now() + idx*1000),
    },
  });
  if((idx+1)%30===0) console.log(`  inserted ${idx+1}/${parsed.length}`);
}
console.log(`Ingested ${parsed.length}`);
await prisma.$disconnect();
