import "dotenv/config";
import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";
const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\ICAR P.G. Entrance Examination (M.V.Sc & Ph.D.)\\ICAR PG Entrance Examination\\ICAR_Animal_Science_2022_MOCK_TEST_JRF_PYP_Format.docx";
const TITLE = "ICAR AIEEA PG 2022 Animal Science";
const TRACK = "icar-jrf";
const EXAM = "icar-entrance";
const YEAR = "2022";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
let existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
if(existing){ console.log(`Deleting existing ${existing.id}`); await prisma.mockTest.delete({ where: { id: existing.id } }); }
console.log("Parsing ICAR 2022 Animal Science Mock...");
const { value } = await mammoth.extractRawText({ path: DOCX_PATH });
let txt = value.replace(/\r/g,"");
let rawLines = txt.split("\n");
let lines=[];
for(const l of rawLines) lines.push(l);
function nextNonEmpty(idx){ while(idx < lines.length && lines[idx].trim()==="") idx++; return idx; }
const parsed=[];
let i=0;
while(i < lines.length){
  let idx = nextNonEmpty(i);
  if(idx>=lines.length) break;
  const line = lines[idx].trim();
  const m0 = line.match(/^Q\.No\.\s*0*(\d+)\s*(.*)/);
  if(!m0){ i=idx+1; continue; }
  const qno = parseInt(m0[1],10);
  let qText = m0[2].trim();
  let qLines=[qText];
  let cur = idx+1;
  while(cur < lines.length){
    let lIdx = nextNonEmpty(cur);
    if(lIdx>=lines.length) break;
    const l = lines[lIdx].trim();
    if(l.startsWith("Choose the correct")||l.startsWith("In light of")||l.startsWith("Choose")){ qLines.push(l); cur=lIdx+1; break; }
    if(l.startsWith("Correct Answer:")||l.startsWith("Answer:")||/^Q\.No\./.test(l)) break;
    // Option detection: 1). , 2). etc. -> break means we reached options
    if(/^[1-4]\)\.\s/.test(l) || /^[1-4]\.\s/.test(l)){ break; }
    // Include List headers and items, Statement lines, A. B. etc.
    qLines.push(l);
    cur=lIdx+1;
    // peek for options
    let peek = nextNonEmpty(cur);
    if(peek < lines.length){
      const pl = lines[peek].trim();
      if( (/^[1-4]\)\.\s/.test(pl) || /^[1-4]\.\s/.test(pl)) ) break;
      if(pl.startsWith("Correct Answer:")) break;
    }
    if(qLines.length>15) break;
  }
  qText = qLines.join("\n").trim();
  // Normalize List formatting to table form
  if(qText.includes("List I") || qText.includes("Match List")){
    // Already formatted as lines with List I, items, List II, etc., but we need to ensure table display uses "→"
    // Convert to table: parse List I items (A. etc.) and List II items (I. etc.) and combine
    const listIIdx = qText.indexOf("List I");
    const listIIIdx = qText.indexOf("List II");
    if(listIIdx!==-1 && listIIIdx!==-1){
      const before = qText.slice(0, listIIdx).trim();
      const listIPart = qText.slice(listIIdx, listIIIdx).trim();
      const afterListII = qText.slice(listIIIdx).trim();
      // Extract items
      const listIMatch = listIPart.match(/List I.*?:\s*(.*)/s);
      const listIContent = listIMatch ? listIMatch[1] : "";
      const listIItems = [];
      const reA = /\b([A-F])\.\s*([^\n]*)/g;
      let m;
      while((m=reA.exec(listIContent))!==null){ listIItems.push(`${m[1]}. ${m[2].trim()}`); }
      // Fallback if regex missed due to newline joining
      if(listIItems.length===0){
        const parts = listIPart.split("\n").slice(1).filter(Boolean);
        for(const p of parts) if(/^[A-F]\./.test(p.trim())) listIItems.push(p.trim());
      }
      const listIITitleMatch = afterListII.match(/List II.*?:\s*(.*)/s);
      // Need to split afterListII into title+items+choose
      const linesAfter = afterListII.split("\n");
      const listIIItems = [];
      let chooseLine="";
      for(const ln of linesAfter){
        const t=ln.trim();
        if(!t) continue;
        if(t.startsWith("List II")) continue;
        if(t.startsWith("Choose")) { chooseLine=t; break; }
        if(/^[IVX]+\./.test(t) || /^I\./.test(t) || /^II\./.test(t)) listIIItems.push(t);
      }
      if(listIItems.length>=4 && listIIItems.length>=4){
        const header = before || "Match List I with List II:";
        const newLines=[header];
        // Keep header if it contains question text
        if(!header.includes("Match")) newLines.unshift("Match List I with List II:");
        newLines.push("List–I  →  List–II");
        const max = Math.max(listIItems.length, listIIItems.length);
        for(let k=0;k<max;k++){
          const a = listIItems[k]||"";
          const b = listIIItems[k]||"";
          if(a||b) newLines.push(`${a}  →  ${b}`);
        }
        if(chooseLine) newLines.push(chooseLine);
        // Preserve any leading question text before List
        // Actually before already is header, so use newLines
        qText = newLines.join("\n");
      }
    }
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
if(parsed.length!==120){ console.error("Not 120, abort"); await prisma.$disconnect(); process.exit(1); }
parsed.sort((a,b)=>a.qno-b.qno);
const test = await prisma.mockTest.create({
  data: { title: TITLE, description: `ICAR AIEEA PG 2022 Animal Science — 120 questions with answer key and explanation. Mock Test format with proper List tables and Statement separation.`, duration: 120, totalMarks: parsed.length, exam: EXAM, track: TRACK, kind: "PREVIOUS_YEAR", year: YEAR, isDemo: false },
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
