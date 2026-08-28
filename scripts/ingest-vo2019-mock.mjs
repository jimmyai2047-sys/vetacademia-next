import "dotenv/config";
import fs from "fs";
import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";

const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\State Public Service Commission\\Veterinary Officer (V.O.)\\Previous Year Papers\\VO-2019_Question_Paper_with_Answers_and_Explanation.docx";
const TITLE = "Veterinary Officer (V.O.) Previous Year Paper 2019 (02 August 2020) — G.K. & Others";
const TRACK = "veterinary-officer";
const EXAM = "psc";
const YEAR = "2019";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

let existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
if (existing) {
  console.log(`Deleting existing MockTest [${existing.id}]...`);
  await prisma.mockTest.delete({ where: { id: existing.id } });
  console.log("Deleted");
}

console.log("Parsing docx with improved list handling...");
const { value } = await mammoth.extractRawText({ path: DOCX_PATH });
let txt = value.replace(/\r/g,"");
let rawLines = txt.split("\n");
let lines = [];
for (const orig of rawLines) {
  const l = orig;
  if (/^\s*[A-D][\.\s]/.test(l) && l.includes("(1)") && l.includes("\t")) {
    const idx = l.indexOf("(1)");
    if (idx > 0) {
      const before = l.slice(0, idx).trim();
      const after = l.slice(idx).trim();
      if (/[A-D]\./.test(before)) {
        lines.push(before);
        lines.push(after);
        continue;
      }
    }
  }
  if (/^\s*[A-D]\./.test(l.trim()) && l.includes("(1)") && !l.trim().startsWith("(1)")) {
    const idx = l.indexOf("(1)");
    if (idx > 0 && idx < l.length - 10) {
      const before = l.slice(0, idx).trim();
      const after = l.slice(idx).trim();
      if (before.length > 5) {
        lines.push(before);
        lines.push(after);
        continue;
      }
    }
  }
  lines.push(l);
}
function nextNonEmpty(idx){ while(idx < lines.length && lines[idx].trim()==="") idx++; return idx; }

function formatListInQuestion(qText) {
  if (!qText.includes("सूची") && !qText.includes("List") && !qText.includes("लेखक") && !qText.includes("Author")) return qText;
  const parts = qText.split("\n");
  let out = [];
  let listRows = [];
  const flush = () => { if (listRows.length>0) { out.push(listRows.join("\n")); listRows=[]; } };
  for (const p of parts) {
    const trimmed = p.trim();
    if (!trimmed) { flush(); out.push(p); continue; }
    // Detect list row: could be "A.चम्बल 1.जाखम" or "I.श्रीधर A.रणमल्ल" etc.
    let isListRow = false;
    let cols = null;
    // Try tab split first (for A. + 1. style)
    if (trimmed.includes("\t")) {
      const tcols = trimmed.split(/\t+/).map(s=>s.trim()).filter(Boolean);
      if (tcols.length===2 && /^[A-DI][\.\s]/.test(tcols[0]) ) { cols = tcols; isListRow = true; }
    }
    if (!isListRow) {
      // Try "A. ... 1. ..." pattern
      const m1 = trimmed.match(/^([A-D][\.\s].*?)\s+(\d+[\.\s].*)/);
      if (m1) { cols = [m1[1].trim(), m1[2].trim()]; isListRow = true; }
    }
    if (!isListRow) {
      // Try "I.श्रीधर A.रणमल्ल" pattern (Roman + Letter)
      const m2 = trimmed.match(/^([I|V|X]+\.\s*[^A]+?)\s+([A-D]\..*)/);
      if (m2) {
        // More precise for I/A
        const left = m2[1].trim();
        const right = m2[2].trim();
        if (/^[IVX]+\./.test(left) && /^[A-D]\./.test(right)) { cols = [left, right]; isListRow = true; }
      }
    }
    if (!isListRow) {
      // Generic: split by " A." or " B." etc. (space + Letter dot)
      const m3 = trimmed.split(/\s+(?=[A-D]\.)/);
      if (m3.length===2 && /^[I|V|X]+\./.test(m3[0].trim()) && /^[A-D]\./.test(m3[1].trim())) {
        cols = m3.map(s=>s.trim()); isListRow = true;
      }
    }
    if (isListRow && cols && cols.length===2) {
      const left = cols[0].replace(/^([A-D]|I{1,3}V?|IV)\./, (m,g)=>`${g}. `).trim().replace(/\s{2,}/g," ");
      const right = cols[1].replace(/^([A-D]|\d+)\./, (m,g)=>`${g}. `).trim().replace(/\s{2,}/g," ");
      listRows.push(`${left}  →  ${right}`);
    } else {
      flush();
      out.push(p);
    }
  }
  flush();
  return out.join("\n");
}

const parsed=[];
let i=0;
while (i < lines.length) {
  let idx = nextNonEmpty(i);
  if (idx>=lines.length) break;
  const line = lines[idx].trim();
  const m0 = line.match(/^(\d+)\.\s*(.*)/);
  if (!m0) { i=idx+1; continue; }
  const qno = parseInt(m0[1],10);
  if (qno<1||qno>300){ i=idx+1; continue; }
  const firstQText = m0[2].trim();
  let hiQ="", enQ="", hiOpts=[], enOpts=[];
  let cur = idx+1;
  if (/[\u0900-\u097F]/.test(firstQText)) {
    // bilingual
    let hiQLines=[firstQText];
    let hiQCur = cur;
    while (hiQCur < lines.length) {
      let lIdx = nextNonEmpty(hiQCur);
      if(lIdx>=lines.length) break;
      const l = lines[lIdx].trim();
      if (/^\([1-4]\)/.test(l)) break;
      if (/^\d+\.\s/.test(l) && !/[\u0900-\u097F]/.test(l)) break;
      // Include list lines
      hiQLines.push(l);
      hiQCur = lIdx+1;
      let peek = nextNonEmpty(hiQCur);
      if (peek < lines.length && /^\([1-4]\)/.test(lines[peek].trim())) break;
      if (peek < lines.length && /^\d+\.\s+[A-Za-z]/.test(lines[peek].trim())) break;
      if (hiQLines.length>8) break;
    }
    hiQ = hiQLines.join("\n").trim();
    hiQ = formatListInQuestion(hiQ);
    cur = hiQCur;
    for(let k=0;k<4;k++){
      let lIdx = nextNonEmpty(cur);
      if(lIdx>=lines.length) break;
      let l = lines[lIdx].trim();
      // Handle concatenated (should already be split by preprocessing, but keep fallback)
      if (l.includes("(1)") && /^[A-D]\./.test(l)) {
        const optStart = l.indexOf("(1)");
        const listPart = l.slice(0, optStart).trim();
        const optPart = l.slice(optStart).trim();
        hiQ += "\n" + listPart;
        l = optPart;
      }
      const mm = l.match(/^\(([1-4])\)\s*(.*)/);
      if(!mm) break;
      hiOpts.push(mm[2].trim());
      cur = lIdx+1;
    }
    if(hiOpts.length!==4){ i=cur; continue; }
    let enQIdx = nextNonEmpty(cur);
    if(enQIdx>=lines.length) break;
    const enQLine = lines[enQIdx].trim();
    const enQMatch = enQLine.match(/^(\d+)\.\s*(.*)/);
    if(!enQMatch || parseInt(enQMatch[1],10)!==qno){ i=enQIdx+1; continue; }
    let enQText = enQMatch[2].trim();
    let enQLines=[enQText];
    let enQCur = enQIdx+1;
    while (enQCur < lines.length) {
      let lIdx = nextNonEmpty(enQCur);
      if(lIdx>=lines.length) break;
      const l = lines[lIdx].trim();
      if (/^\([1-4]\)/.test(l)) break;
      if (/^\d+\.\s/.test(l) && l.includes("Answer:")) break;
      if (l.startsWith("Answer:")) break;
      enQLines.push(l);
      enQCur = lIdx+1;
      let peek2 = nextNonEmpty(enQCur);
      if (peek2 < lines.length && /^\([1-4]\)/.test(lines[peek2].trim())) break;
      if (enQLines.length>8) break;
    }
    enQ = enQLines.join("\n").trim();
    enQ = formatListInQuestion(enQ);
    cur = enQCur;
    for(let k=0;k<4;k++){
      let lIdx = nextNonEmpty(cur);
      if(lIdx>=lines.length) break;
      let l = lines[lIdx].trim();
      if (l.includes("(1)") && /^[A-D]\./.test(l)) {
        const optStart = l.indexOf("(1)");
        const listPart = l.slice(0, optStart).trim();
        const optPart = l.slice(optStart).trim();
        enQ += "\n" + listPart;
        l = optPart;
      }
      const mm = l.match(/^\(([1-4])\)\s*(.*)/);
      if(!mm) break;
      enOpts.push(mm[2].trim());
      cur = lIdx+1;
    }
    if(enOpts.length!==4){ i=cur; continue; }
  } else {
    // English only
    let enQLines=[firstQText];
    let enQCur = idx+1;
    while (enQCur < lines.length) {
      let lIdx = nextNonEmpty(enQCur);
      if(lIdx>=lines.length) break;
      const l = lines[lIdx].trim();
      if (/^\([1-4]\)/.test(l)) break;
      if (l.startsWith("Answer:")) break;
      if (/^\d+\.\s/.test(l)) break;
      enQLines.push(l);
      enQCur = lIdx+1;
      let peek = nextNonEmpty(enQCur);
      if (peek < lines.length && /^\([1-4]\)/.test(lines[peek].trim())) break;
      if (enQLines.length>8) break;
    }
    enQ = enQLines.join("\n").trim();
    enQ = formatListInQuestion(enQ);
    cur = enQCur;
    for(let k=0;k<4;k++){
      let lIdx = nextNonEmpty(cur);
      if(lIdx>=lines.length) break;
      let l = lines[lIdx].trim();
      if (l.includes("(1)") && /^[A-D]\./.test(l)) {
        const optStart = l.indexOf("(1)");
        const listPart = l.slice(0, optStart).trim();
        const optPart = l.slice(optStart).trim();
        enQ += "\n" + listPart;
        l = optPart;
      }
      const mm = l.match(/^\(([1-4])\)\s*(.*)/);
      if(!mm) break;
      enOpts.push(mm[2].trim());
      cur = lIdx+1;
    }
    if(enOpts.length!==4){ i=cur; continue; }
    hiQ=""; hiOpts=[];
  }
  let ansIdx = nextNonEmpty(cur);
  if(ansIdx>=lines.length) break;
  const ansLine = lines[ansIdx].trim();
  const ansM = ansLine.match(/Answer:\s*\(([1-4])\)/);
  if(!ansM){ i=ansIdx+1; continue; }
  const correct = parseInt(ansM[1],10)-1;
  let explanation="";
  const dashIdx = ansLine.indexOf("—");
  if(dashIdx!==-1) explanation = ansLine.slice(dashIdx+1).trim();
  else {
    let expIdx = nextNonEmpty(ansIdx+1);
    let expLines=[]; let expCur=expIdx;
    while(expCur<lines.length){
      let lIdx=nextNonEmpty(expCur);
      if(lIdx>=lines.length) break;
      const l=lines[lIdx].trim();
      if(/^\d+\.\s/.test(l)) break;
      expLines.push(l);
      expCur=lIdx+1;
      let peek=nextNonEmpty(expCur);
      if(peek<lines.length && /^\d+\.\s/.test(lines[peek].trim())) break;
    }
    explanation=expLines.join(" ").trim();
    cur=expCur;
  }
  if(dashIdx!==-1) cur=ansIdx+1;
  parsed.push({ qno, hiQ, hiOpts, enQ, enOpts, correct, explanation });
  i=cur;
}
console.log(`Parsed ${parsed.length} questions`);
const missing=[];
for(let n=1;n<=150;n++) if(!parsed.some(p=>p.qno===n)) missing.push(n);
console.log("missing", missing.length, missing);
if(parsed.length!==150){ console.error("Not 150, abort"); await prisma.$disconnect(); process.exit(1); }
parsed.sort((a,b)=>a.qno-b.qno);
// Verify sequence: first 50 should be bilingual (hiQ present), 51-150 English only
const gkCount = parsed.slice(0,50).filter(p=>p.hiQ).length;
const subjCount = parsed.slice(50).filter(p=>!p.hiQ).length;
console.log(`GK bilingual 1-50: ${gkCount}/50, Subject English 51-150: ${subjCount}/100`);
const test = await prisma.mockTest.create({
  data: { title: TITLE, description: `VO 2019 (02 Aug 2020) — G.K. (1-50 bilingual) + Subject (51-150 English) with answer key and explanation. ${parsed.length} questions.`, duration: 180, totalMarks: parsed.length, exam: EXAM, track: TRACK, kind: "PREVIOUS_YEAR", year: YEAR, isDemo: false },
});
console.log(`Created MockTest ${test.id}`);
// Insert questions one by one to preserve order via createdAt
for (let idx=0; idx<parsed.length; idx++) {
  const p = parsed[idx];
  const questionText = p.hiQ ? `${p.hiQ}\n${p.enQ}` : p.enQ;
  let opts;
  if (p.hiQ) {
    opts = p.hiOpts.map((hi,i)=>{
      const en=p.enOpts[i];
      return hi.trim()===en.trim() ? hi.trim() : `${hi} / ${en}`;
    });
  } else {
    opts = p.enOpts;
  }
  await prisma.question.create({
    data: {
      text: normalize(questionText, "\n"),
      options: JSON.stringify(opts.map(o=>normalize(o," / ")).map(o=>{ const parts=o.split(" / ").map(s=>s.trim()); return parts.length===2 && parts[0]===parts[1] ? parts[0] : o; })),
      correctAnswer: p.correct,
      marks: 1, difficulty: 2, explanation: p.explanation, mockTestId: test.id,
      createdAt: new Date(Date.now() + idx*1000),
    },
  });
  if ((idx+1)%30===0) console.log(`  inserted ${idx+1}/${parsed.length}`);
}
console.log(`Ingested ${parsed.length} in correct sequence`);
await prisma.$disconnect();
