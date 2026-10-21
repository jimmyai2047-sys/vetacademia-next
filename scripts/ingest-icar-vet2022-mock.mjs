import "dotenv/config";
import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";
const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\ICAR P.G. Entrance Examination (M.V.Sc & Ph.D.)\\ICAR PG Entrance Examination\\ICAR_Veterinary_Science_2022_MOCK_TEST_JRF_PYP_Format.docx";
const TITLE = "ICAR AIEEA PG 2022 Veterinary Science";
const TRACK = "icar-jrf";
const EXAM = "icar-entrance";
const YEAR = "2022";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
let existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
if(existing){ console.log(`Deleting existing ${existing.id}`); await prisma.mockTest.delete({ where: { id: existing.id } }); }
console.log("Parsing ICAR 2022 Veterinary Science Mock...");
const { value } = await mammoth.extractRawText({ path: DOCX_PATH });
let txt = value.replace(/\r/g,"");
let rawLines = txt.split("\n");
let lines=[];
for(const l of rawLines) lines.push(l);
// Debug: show first 30 lines
console.log("First 20 raw lines:");
for(let i=0;i<20 && i<lines.length;i++) console.log(`${i}: ${JSON.stringify(lines[i])}`);
function nextNonEmpty(idx){ while(idx < lines.length && lines[idx].trim()==="") idx++; return idx; }
const parsed=[];
let i=0;
while(i < lines.length){
  let idx = nextNonEmpty(i);
  if(idx>=lines.length) break;
  const line = lines[idx].trim();
  const m0 = line.match(/^Q No\s*0*(\d+)\s*(.*)/i) || line.match(/^Q\.No\.\s*0*(\d+)\s*(.*)/);
  if(!m0){ i=idx+1; continue; }
  const qno = parseInt(m0[1],10);
  let qText = m0[2].trim();
  let qLines=[qText];
  let cur = idx+1;
  while(cur < lines.length){
    let lIdx = nextNonEmpty(cur);
    if(lIdx>=lines.length) break;
    const l = lines[lIdx].trim();
    if(l.startsWith("Choose the correct")||l.startsWith("In light of")){ qLines.push(l); cur=lIdx+1; 
      // also include following "Options:-" line if present
      let peek = nextNonEmpty(cur);
      if(peek < lines.length && lines[peek].trim().startsWith("Options")){
        qLines.push(lines[peek].trim());
        cur = peek+1;
      }
      // Check if next is options, then break, else continue
      let peek2 = nextNonEmpty(cur);
      if(peek2 < lines.length && (/^[1-4]\)\.\s/.test(lines[peek2].trim()) || /^[1-4]\.\s/.test(lines[peek2].trim()))) break;
      continue;
    }
    if(l.startsWith("Choose")){ qLines.push(l); cur=lIdx+1; break; }
    if(l.startsWith("Correct Answer:")||l.startsWith("Answer:")||/^Q No\s*\d+/i.test(l)||/^Q\.No\./.test(l)) break;
    if(l.startsWith("Options:-")||l.startsWith("Options:")) { qLines.push(l); cur=lIdx+1; continue; }
    if(/^[1-4]\)\.\s/.test(l) || /^[1-4]\.\s/.test(l)){ break; }
    qLines.push(l);
    cur=lIdx+1;
    let peek = nextNonEmpty(cur);
    if(peek < lines.length){
      const pl = lines[peek].trim();
      if( (/^[1-4]\)\.\s/.test(pl) || /^[1-4]\.\s/.test(pl)) ) break;
      if(pl.startsWith("Correct Answer:")) break;
    }
    if(qLines.length>20) break;
  }
  qText = qLines.join("\n").trim();
  // Fix List I / List II tables extracted as separate lines
  if(qText.includes("List I") && qText.includes("List II")){
    const lines = qText.split("\n").map(s=>s.trim()).filter(Boolean);
    // Find header
    const headerLine = lines.find(l=>l.includes("Match List")) || "Match List I with List II:";
    const chooseLine = lines.find(l=>l.startsWith("Choose the correct") || l.startsWith("In light of")) || "";
    // Extract left items (A., B., C., D., E.) and right items (I., II., III., IV., V.)
    const leftItems = [];
    const rightItems = [];
    for(const l of lines){
      if(/^[A-E]\.\s/.test(l)) leftItems.push(l);
      else if(/^(I{1,3}V?|IV|V)\.\s/.test(l) || /^V\.\s/.test(l)) rightItems.push(l);
    }
    // If we have both, reconstruct
    if(leftItems.length>=4 && rightItems.length>=4){
      const newLines = [headerLine, "List–I  →  List–II"];
      // For tables with extra V item (right extra), pair accordingly
      // For Q68/69/76, right has 5 items, left has 4 -> last right has empty left
      const max = Math.max(leftItems.length, rightItems.length);
      for(let k=0;k<max;k++){
        const a = leftItems[k] || "";
        const b = rightItems[k] || "";
        if(a && b) newLines.push(`${a}  →  ${b}`);
        else if(a) newLines.push(`${a}`);
        else if(b) newLines.push(`  →  ${b}`);
      }
      if(chooseLine) newLines.push(chooseLine);
      qText = newLines.join("\n");
    }
  }
  if(qText.includes("Statement I:") && qText.includes("Statement II:") && !qText.includes("\nStatement II:")){
    qText = qText.replace(/Statement II:/g, "\nStatement II:");
  }
  if(qText.includes("Assertion A") && !qText.includes("\nReason R")){
    qText = qText.replace(/Reason R/g, "\nReason R");
  }
  // Also split combined A. B. items that may still be on same line (should not happen after doc fix, but handle)
  if(qText.includes("A. ") && qText.includes(" B. ") && !qText.includes("\nB.")){
    // This is fallback for combined items that slipped through, but List handling already covers
  }
  let opts=[];
  let optCur = cur;
  for(let k=0;k<4;k++){
    let lIdx = nextNonEmpty(optCur);
    if(lIdx>=lines.length) break;
    let l = lines[lIdx].trim();
    let mm = l.match(/^[1-4]\)\.\s*(.*)/);
    if(!mm) mm = l.match(/^[1-4]\.\s*(.*)/);
    if(!mm) break;
    opts.push(mm[1].trim());
    optCur = lIdx+1;
  }
  if(opts.length!==4){ i=optCur; continue; }
  let ansIdx = nextNonEmpty(optCur);
  if(ansIdx>=lines.length) break;
  const ansLine = lines[ansIdx].trim();
  const ansM = ansLine.match(/Correct Answer:\s*([1-4])\)\./) || ansLine.match(/Correct Answer:\s*([1-4])/) || ansLine.match(/Correct Answer:\s*Option\s*([1-4])/);
  let correct;
  if(ansM){ correct = parseInt(ansM[1],10)-1; } else { i=ansIdx+1; continue; }
  let explanation="";
  const expIdx = ansLine.indexOf("Explanation:");
  if(expIdx!==-1) explanation = ansLine.slice(expIdx+12).trim();
  else {
    let lIdx = nextNonEmpty(ansIdx+1);
    if(lIdx<lines.length && lines[lIdx].trim().startsWith("Explanation:")){
      explanation = lines[lIdx].trim().replace(/^Explanation:\s*/,"").trim();
      cur = lIdx+1;
    } else cur = ansIdx+1;
  }
  if(expIdx!==-1) cur = ansIdx+1;
  else if(!explanation) cur = ansIdx+1;
  parsed.push({ qno, qText, opts, correct, explanation });
  i = cur;
}
console.log(`Parsed ${parsed.length} questions`);
const missing=[];
for(let n=1;n<=120;n++) if(!parsed.some(p=>p.qno===n)) missing.push(n);
console.log("missing", missing.length, missing.slice(0,20));
if(parsed.length!==120){ console.error("Not 120, abort - showing first few parsed qnos", parsed.map(p=>p.qno).slice(0,10)); await prisma.$disconnect(); process.exit(1); }
parsed.sort((a,b)=>a.qno-b.qno);
// Show sample qText for list question
const sampleList = parsed.find(p=>p.qno===10);
if(sampleList) console.log("Sample Q10 qText:\n", sampleList.qText.slice(0,600));
const sampleStmt = parsed.find(p=>p.qno===17);
if(sampleStmt) console.log("Sample Q17 qText:\n", sampleStmt.qText.slice(0,600));
const test = await prisma.mockTest.create({
  data: { title: TITLE, description: `ICAR AIEEA PG 2022 Veterinary Science — 120 questions with answer key and explanation. Mock Test format with proper List tables, Statement separation and 1). numbering.`, duration: 120, totalMarks: parsed.length, exam: EXAM, track: TRACK, kind: "PREVIOUS_YEAR", year: YEAR, isDemo: false },
});
console.log(`Created MockTest ${test.id}`);
for(let idx=0; idx<parsed.length; idx++){
  const p = parsed[idx];
  await prisma.question.create({
    data: {
      text: normalize(p.qText, "\n"),
      options: JSON.stringify(p.opts.map(o=>normalize(o," / "))),
      correctAnswer: p.correct,
      marks: 1, difficulty: 2, explanation: p.explanation ? normalize(p.explanation, " ") : "", mockTestId: test.id,
      createdAt: new Date(Date.now() + idx*1000),
    },
  });
  if((idx+1)%30===0) console.log(`  inserted ${idx+1}/${parsed.length}`);
}
console.log(`Ingested ${parsed.length}`);
await prisma.$disconnect();
