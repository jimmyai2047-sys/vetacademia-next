import "dotenv/config";
import fs from "fs";
import mammoth from "mammoth";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";

const PDF_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\State Public Service Commission\\Livestock Assistant (L.S.A.)\\Previous Year Papers (PYP)\\LSA 2018.pdf";
const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\State Public Service Commission\\Livestock Assistant (L.S.A.)\\Previous Year Papers (PYP)\\LSA_2018_QuestionPaper_with_AnswerKey.docx";
const TITLE = "Livestock Assistant (L.S.A.) Previous Year Paper 2018 (21 October 2018)";
const TRACK = "livestock-assistant";
const EXAM = "psc";
const YEAR = "2018";
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 1) Ensure Post exists
const pdfFile = "LSA 2018.pdf";
let post = await prisma.post.findFirst({ where: { category: "PREVIOUS_YEAR", track: TRACK, fileName: pdfFile } });
if (!post) {
  console.log("Creating Post for LSA 2018...");
  const size = fs.statSync(PDF_PATH).size;
  const safeName = pdfFile.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blobPath = `uploads/${Date.now()}-${safeName}`;
  const buffer = fs.readFileSync(PDF_PATH);
  const blob = await put(blobPath, buffer, { access: "private", token: TOKEN, addRandomSuffix: false, multipart: true, contentType: "application/pdf" });
  post = await prisma.post.create({
    data: { title: TITLE, category: "PREVIOUS_YEAR", content: `Livestock Assistant (L.S.A.) previous year question paper — ${pdfFile}.`, exam: EXAM, track: TRACK, published: true, fileUrl: blob.url, fileName: pdfFile, fileType: "PDF", fileSize: size },
  });
  console.log(`Created Post [${post.id}]`);
} else console.log(`Post already exists [${post.id}] ${post.title}`);

// 2) Check MockTest exists
let existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
if (existing) { console.log(`MockTest already exists [${existing.id}] ${TITLE} — skipping.`); await prisma.$disconnect(); process.exit(0); }

// 3) Parse docx
console.log("Parsing docx...");
const { value } = await mammoth.extractRawText({ path: DOCX_PATH });
const txt = value.replace(/\r/g,"");
const lines = txt.split(/\r?\n/);
function nextNonEmpty(idx){ while(idx < lines.length && lines[idx].trim()==="") idx++; return idx; }
const parsed=[];
let i=0;
while (i < lines.length) {
  let idx = nextNonEmpty(i);
  if (idx>=lines.length) break;
  const line = lines[idx].trim();
  if (!/^\d+$/.test(line)) { i=idx+1; continue; }
  const qno = parseInt(line,10);
  if (qno<1||qno>200){ i=idx+1; continue; }
  let enQIdx = nextNonEmpty(idx+1);
  if (enQIdx>=lines.length) break;
  let enQLines=[];
  let enQCur = enQIdx;
  while (enQCur < lines.length) {
    let lIdx = nextNonEmpty(enQCur);
    if (lIdx>=lines.length) break;
    const l = lines[lIdx].trim();
    if (l.includes("(A)")) break;
    if (l.includes("Question Booklet")||l.includes("Date:")||l.includes("Q.No.")||l==="English"||l==="हिन्दी (Hindi)"||l.includes("हिन्दी")){ enQLines=[]; break; }
    enQLines.push(l);
    enQCur = lIdx+1;
  }
  if (enQLines.length===0){ i=enQCur; continue; }
  const enQ = enQLines.join(" ").trim();
  let enOpts=[];
  let cur = enQCur;
  let enBlock=""; let enLinesCollected=0;
  while (enOpts.length<4 && cur < lines.length && enLinesCollected<2) {
    let lIdx = nextNonEmpty(cur);
    if (lIdx>=lines.length) break;
    const l = lines[lIdx].trim();
    if (l.startsWith("Answer")||/^\d+$/.test(l)||l.includes("हिन्दी")||l.includes("English")) break;
    if (!l.includes("(A)")&&!l.includes("(B)")&&!l.includes("(C)")&&!l.includes("(D)")){ cur=lIdx+1; continue; }
    enBlock += " " + l;
    enLinesCollected++;
    cur = lIdx+1;
    const mEn = enBlock.match(/\(A\)\s*(.*?)\s*\(B\)\s*(.*?)\s*\(C\)\s*(.*?)\s*\(D\)\s*(.*)/);
    if (mEn) { enOpts=[mEn[1].trim(),mEn[2].trim(),mEn[3].trim(),mEn[4].trim()]; break; }
  }
  if (enOpts.length!==4){ const mEn=enBlock.match(/\(A\)\s*(.*?)\s*\(B\)\s*(.*?)\s*\(C\)\s*(.*?)\s*\(D\)\s*(.*)/); if(mEn) enOpts=[mEn[1].trim(),mEn[2].trim(),mEn[3].trim(),mEn[4].trim()]; }
  if (enOpts.length!==4){ i=cur; continue; }
  let hiQIdx = nextNonEmpty(cur);
  if (hiQIdx>=lines.length) break;
  let hiQLines=[]; let hiQCur=hiQIdx;
  while (hiQCur < lines.length) {
    let lIdx=nextNonEmpty(hiQCur);
    if(lIdx>=lines.length) break;
    const l=lines[lIdx].trim();
    if(l.includes("(A)")) break;
    hiQLines.push(l);
    hiQCur=lIdx+1;
  }
  const hiQ = hiQLines.join(" ").trim();
  let hiOpts=[]; let hiBlock=""; let hiLinesCollected=0;
  cur = hiQCur;
  while (hiOpts.length<4 && cur < lines.length && hiLinesCollected<2) {
    let lIdx=nextNonEmpty(cur);
    if(lIdx>=lines.length) break;
    const l=lines[lIdx].trim();
    if(l.startsWith("Answer")||l.startsWith("Explanation")||/^\d+$/.test(l)) break;
    if(!l.includes("(A)")&&!l.includes("(B)")&&!l.includes("(C)")&&!l.includes("(D)")){cur=lIdx+1; continue;}
    hiBlock += " " + l;
    hiLinesCollected++;
    cur=lIdx+1;
    const mHi=hiBlock.match(/\(A\)\s*(.*?)\s*\(B\)\s*(.*?)\s*\(C\)\s*(.*?)\s*\(D\)\s*(.*)/);
    if(mHi){ hiOpts=[mHi[1].trim(),mHi[2].trim(),mHi[3].trim(),mHi[4].trim()]; break; }
  }
  if(hiOpts.length!==4){ const mHi=hiBlock.match(/\(A\)\s*(.*?)\s*\(B\)\s*(.*?)\s*\(C\)\s*(.*?)\s*\(D\)\s*(.*)/); if(mHi) hiOpts=[mHi[1].trim(),mHi[2].trim(),mHi[3].trim(),mHi[4].trim()]; }
  if(hiOpts.length!==4){ i=cur; continue; }
  let ansIdx=nextNonEmpty(cur);
  if(ansIdx>=lines.length) break;
  const ansLine=lines[ansIdx].trim();
  const ansM=ansLine.match(/Answer\s*\/\s*उत्तर:\s*\(([A-D])\)/);
  if(!ansM){ i=ansIdx+1; continue; }
  const correct=ansM[1].charCodeAt(0)-65;
  let expIdx=nextNonEmpty(ansIdx+1);
  let expLines=[]; let expCur=expIdx;
  while(expCur<lines.length){
    let lIdx=nextNonEmpty(expCur);
    if(lIdx>=lines.length) break;
    const l=lines[lIdx].trim();
    if(/^\d+$/.test(l)) break;
    if(l.startsWith("Explanation:")) expLines.push(l.replace(/^Explanation:\s*/,"").trim());
    else if(expLines.length>0) expLines[expLines.length-1] += " " + l;
    else expLines.push(l);
    expCur=lIdx+1;
    let peek=nextNonEmpty(expCur);
    if(peek<lines.length && /^\d+$/.test(lines[peek].trim())) break;
  }
  const explanation=expLines.join(" ").trim();
  parsed.push({ qno, enQ, enOpts, hiQ, hiOpts, correct, explanation });
  i=expCur;
}
console.log(`Parsed ${parsed.length} questions`);
if (parsed.length===0){ console.error("No questions parsed"); await prisma.$disconnect(); process.exit(1); }
parsed.sort((a,b)=>a.qno-b.qno);
console.log(parsed.slice(0,2).map(p=>`Q${p.qno} ans=${String.fromCharCode(65+p.correct)}`));

const test = await prisma.mockTest.create({
  data: { title: TITLE, description: `LSA 2018 previous year paper with answer key and explanation. ${parsed.length} questions.`, duration: 120, totalMarks: parsed.length, exam: EXAM, track: TRACK, kind: "PREVIOUS_YEAR", year: YEAR, isDemo: false },
});
console.log(`Created MockTest ${test.id}`);
const rows = parsed.map(p=>{
  const questionText = `${p.hiQ}\n${p.enQ}`;
  const opts = p.hiOpts.map((hi,i)=>{
    const en=p.enOpts[i];
    return hi.trim()===en.trim() ? hi.trim() : `${hi} / ${en}`;
  });
  return {
    text: normalize(questionText, "\n"),
    options: JSON.stringify(opts.map(o=>normalize(o," / ")).map(o=>{ const parts=o.split(" / ").map(s=>s.trim()); return parts.length===2 && parts[0]===parts[1] ? parts[0] : o; })),
    correctAnswer: p.correct,
    marks: 1, difficulty: 2, explanation: p.explanation, mockTestId: test.id,
  };
});
await prisma.question.createMany({ data: rows });
console.log(`Ingested ${rows.length} questions`);
await prisma.$disconnect();
