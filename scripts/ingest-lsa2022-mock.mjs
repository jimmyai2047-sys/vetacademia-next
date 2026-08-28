import "dotenv/config";
import fs from "fs";
import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";

const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\State Public Service Commission\\Livestock Assistant (L.S.A.)\\Previous Year Papers (PYP)\\LSA_2022_QuestionPaper_with_AnswerKey_with_explanation.docx";
const PDF_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\State Public Service Commission\\Livestock Assistant (L.S.A.)\\Previous Year Papers (PYP)\\LSA 2022.pdf";
const TITLE = "Livestock Assistant (L.S.A.) Previous Year Paper 2022 (04 June 2022) — Booklet 117";
const TRACK = "livestock-assistant";
const EXAM = "psc";
const YEAR = "2022";

import { put } from "@vercel/blob";
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Ensure Post
const pdfFile = "LSA 2022.pdf";
let post = await prisma.post.findFirst({ where: { category: "PREVIOUS_YEAR", track: TRACK, fileName: pdfFile } });
if (!post) {
  console.log("Creating Post for LSA 2022...");
  const size = fs.statSync(PDF_PATH).size;
  const safeName = pdfFile.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blobPath = `uploads/${Date.now()}-${safeName}`;
  const buffer = fs.readFileSync(PDF_PATH);
  const blob = await put(blobPath, buffer, { access: "private", token: TOKEN, addRandomSuffix: false, multipart: true, contentType: "application/pdf" });
  post = await prisma.post.create({
    data: { title: TITLE, category: "PREVIOUS_YEAR", content: `LSA previous year paper — ${pdfFile}.`, exam: EXAM, track: TRACK, published: true, fileUrl: blob.url, fileName: pdfFile, fileType: "PDF", fileSize: size },
  });
  console.log(`Created Post [${post.id}]`);
} else console.log(`Post already exists [${post.id}]`);

let existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
if (existing) { console.log(`MockTest already exists [${existing.id}] — skipping`); await prisma.$disconnect(); process.exit(0); }

console.log("Parsing docx...");
const { value } = await mammoth.extractRawText({ path: DOCX_PATH });
const txt = value.replace(/\r/g,"");
const lines = txt.split("\n");
function nextNonEmpty(idx){ while(idx < lines.length && lines[idx].trim()==="") idx++; return idx; }

const parsed=[];
let i=0;
while (i < lines.length) {
  let idx = nextNonEmpty(i);
  if (idx>=lines.length) break;
  const line = lines[idx].trim();
  const m0 = line.match(/^Q(\d+)\.\s*(.*)/);
  if (!m0) { i=idx+1; continue; }
  const qno = parseInt(m0[1],10);
  const enQ = m0[2].trim();
  // Hindi Q next non-empty
  let hiQIdx = nextNonEmpty(idx+1);
  if (hiQIdx>=lines.length) break;
  const hiQ = lines[hiQIdx].trim();
  if (!/[\u0900-\u097F]/.test(hiQ)) { i=hiQIdx+1; continue; }
  // 4 options
  let opts=[];
  let cur = hiQIdx+1;
  for(let k=0;k<4;k++){
    let lIdx = nextNonEmpty(cur);
    if(lIdx>=lines.length) break;
    const l = lines[lIdx].trim();
    const mm = l.match(/^\(([A-D])\)\s*(.*)/);
    if(!mm) break;
    opts.push(mm[2].trim());
    cur = lIdx+1;
  }
  if(opts.length!==4){ i=cur; continue; }
  // Answer line
  let ansIdx = nextNonEmpty(cur);
  if(ansIdx>=lines.length) break;
  const ansLine = lines[ansIdx].trim();
  const ansM = ansLine.match(/Answer\s*\/\s*उत्तर:\s*\(([A-D])\)/);
  if(!ansM){ i=ansIdx+1; continue; }
  const correct = ansM[1].charCodeAt(0)-65;
  // Explanation: next 1-2 lines after answer, up to next Q
  let expLines=[];
  let expCur = ansIdx+1;
  // Explanation: may be "Explanation: ..." and "व्याख्या: ..." on next two non-empty lines
  for(let e=0;e<2;e++){
    let lIdx = nextNonEmpty(expCur);
    if(lIdx>=lines.length) break;
    const l = lines[lIdx].trim();
    if(/^Q\d+\./.test(l)) break;
    if(l.startsWith("Explanation:") || l.startsWith("व्याख्या:")){
      expLines.push(l);
      expCur = lIdx+1;
    } else if(expLines.length>0){
      // continuation? but usually just 2 lines
      break;
    } else break;
  }
  const explanation = expLines.join("\n").trim();
  // Also collect any additional explanation lines until next Q (in case explanation is multi-line)
  // For now, the two lines are enough; but check if next line is not Q and not empty, could be continuation
  // Our loop already handles 2, but we can also collect until next Q if more
  let extraCur = expCur;
  while(true){
    let lIdx = nextNonEmpty(extraCur);
    if(lIdx>=lines.length) break;
    const l = lines[lIdx].trim();
    if(/^Q\d+\./.test(l)) break;
    if(l.startsWith("Explanation:")||l.startsWith("व्याख्या:")) break;
    if(l && !l.startsWith("(") && expLines.length<4){
      // This might be continuation of explanation, but we already have 2, so break
      break;
    }
    break;
  }
  parsed.push({ qno, enQ, hiQ, opts, correct, explanation });
  i = expCur;
  // Skip any remaining explanation lines already consumed
  // Find next Q
  let nextQ = nextNonEmpty(i);
  // i is already at expCur, which is after the 2 explanation lines, next should be next Q
  i = nextQ;
}
console.log(`Parsed ${parsed.length} questions`);
if(parsed.length===0){ console.error("No parsed"); await prisma.$disconnect(); process.exit(1); }
parsed.sort((a,b)=>a.qno-b.qno);
console.log(parsed.slice(0,2).map(p=>`Q${p.qno} ans=${String.fromCharCode(65+p.correct)} enQ=${p.enQ.slice(0,30)} hiQ=${p.hiQ.slice(0,20)} opts=${p.opts[0].slice(0,20)}`));
const missing=[];
for(let n=1;n<=120;n++) if(!parsed.some(p=>p.qno===n)) missing.push(n);
console.log("missing", missing.length, missing.slice(0,10));
if(parsed.length!==120){ console.error("Not 120, abort"); await prisma.$disconnect(); process.exit(1); }

const test = await prisma.mockTest.create({
  data: { title: TITLE, description: `LSA 2022 (04 June 2022, Booklet 117) — bilingual with answer key and explanation. ${parsed.length} questions.`, duration: 120, totalMarks: parsed.length, exam: EXAM, track: TRACK, kind: "PREVIOUS_YEAR", year: YEAR, isDemo: false },
});
console.log(`Created MockTest ${test.id}`);
const rows = parsed.map(p=>{
  const questionText = `${p.hiQ}\n${p.enQ}`;
  const opts = p.opts.map(o=>{
    // Each opt is like "Chalukya / चालुक्य" or "9th / 9वाँ" or "15 / 15"
    const parts = o.split(" / ").map(s=>s.trim());
    if(parts.length===2){
      const en = parts[0].trim();
      const hi = parts[1].trim();
      // File has "English / Hindi" (English first), we want "Hindi / English" (Hindi first) and deduplicate if same
      if(en===hi) return en;
      // Also check if they are same numeric after trimming
      if(en.replace(/\s/g,"")===hi.replace(/\s/g,"")) return en;
      return `${hi} / ${en}`;
    }
    return o;
  });
  return {
    text: normalize(questionText, "\n"),
    options: JSON.stringify(opts.map(o=>normalize(o," / ")).map(o=>{ const parts=o.split(" / ").map(s=>s.trim()); return parts.length===2 && parts[0]===parts[1] ? parts[0] : o; })),
    correctAnswer: p.correct,
    marks: 1, difficulty: 2, explanation: p.explanation, mockTestId: test.id,
    createdAt: new Date(Date.now() + p.qno*1000),
  };
});
// Use createMany with explicit createdAt? But createMany may not support createdAt override? We'll use create loop to preserve order
for(let idx=0; idx<rows.length; idx++){
  const r = rows[idx];
  await prisma.question.create({ data: r });
  if((idx+1)%30===0) console.log(`  inserted ${idx+1}/${rows.length}`);
}
console.log(`Ingested ${rows.length}`);
await prisma.$disconnect();
