import "dotenv/config";
import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";
const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\ICAR P.G. Entrance Examination (M.V.Sc & Ph.D.)\\ICAR PG Entrance Examination\\ICAR_Veterinary_Science_2025_QuestionPaper_Answer_Explanation.docx";
const TITLE = "ICAR AIEEA PG 2025 Veterinary Science";
const TRACK = "icar-jrf";
const EXAM = "icar-entrance";
const YEAR = "2025";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
let existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
if(existing){ console.log(`Deleting existing ${existing.id}`); await prisma.mockTest.delete({ where: { id: existing.id } }); }
console.log("Parsing ICAR Vet 2025...");
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
    if(l.startsWith("Choose the correct") || l.startsWith("Correct Answer:") || l.startsWith("Answer:") || /^Q\.No\./.test(l) || /^[1-4]\.\s/.test(l)){
      if(qText.includes("Match List") && /^[1-4]\.\s/.test(l) && l.includes("–")){
        qLines.push(l); cur=lIdx+1; continue;
      }
      if(l.startsWith("Choose the correct")){ qLines.push(l); cur=lIdx+1; break; }
      break;
    }
    // For questions like Q02, the statements "(A) Cats (B) Camels..." are part of question, not options
    // Check if this is a statement line that should be included in qText
    const isStatement = /^\([A-D]\)/.test(l) || /^\([A-D]\)\./.test(l);
    const isQuestionWithStatements = qText.includes("Which of the following animals are induced ovulators") || qText.includes("The sequence of cellular events") || qText.includes("Histologically, large intestine") || qText.includes("Which of the following is true for mast cells");
    if(isStatement && isQuestionWithStatements){
      qLines.push(l); cur=lIdx+1; continue;
    }
    qLines.push(l);
    cur=lIdx+1;
    let peek = nextNonEmpty(cur);
    if(peek < lines.length){
      const pl = lines[peek].trim();
      if(/^[1-4]\.\s/.test(pl) && !pl.includes("–") && !qText.includes("Match List")) break;
      if(pl.startsWith("Correct Answer:")) break;
    }
    if(qLines.length>8) break;
  }
  qText = qLines.join("\n").trim();
  // Handle Match List with proper table
  if(qText.includes("Match List")){
    const parts = qText.split("\n");
    let header = parts[0].trim();
    let listLines = parts.slice(1).filter(p=>p.trim() && !p.includes("Choose the correct"));
    let chooseLine = parts.find(p=>p.includes("Choose the correct")) || "";
    let tableRows=[];
    for(const pl of listLines){
      const trimmed = pl.trim();
      const dashIdx = trimmed.indexOf("–") !== -1 ? trimmed.indexOf("–") : trimmed.indexOf("-");
      let cols = trimmed.split("–").map(s=>s.trim());
      if(cols.length===2){
        tableRows.push(cols);
      } else {
        cols = trimmed.split(" - ").map(s=>s.trim());
        if(cols.length===2) tableRows.push(cols);
        else tableRows.push([trimmed]);
      }
    }
    if(tableRows.length>=2){
      const newLines = [header, "List–I  →  List–II"];
      for(const row of tableRows){
        if(row.length===2) newLines.push(`${row[0]}  →  ${row[1]}`);
        else newLines.push(row[0]);
      }
      if(chooseLine) newLines.push(chooseLine);
      qText = newLines.join("\n");
    }
  }
  // Handle "Which of the following is true" etc. where statements are on one line
  if(qText.includes("(A)") && qText.includes("(B)") && !qText.includes("\n(A)")){
    const idxA = qText.indexOf(" (A)");
    if(idxA!==-1){
      const before = qText.slice(0, idxA).trim();
      const after = qText.slice(idxA).trim();
      const re = /\(([A-D])\)\s*([^\(]*?)(?=\s*\([A-D]\)|$)/g;
      let m;
      const stmts=[];
      while((m=re.exec(after))!==null){
        stmts.push(`(${m[1]}) ${m[2].trim()}`);
      }
      if(stmts.length>=3){
        qText = before + "\n" + stmts.join("\n");
      }
    }
  }
  if(qText.includes("Statement (I):") && qText.includes("Statement (II):") && !qText.includes("\nStatement (II):")){
    qText = qText.replace(/:\s*Statement\s*\(II\):/g, ":\nStatement (II):");
    qText = qText.replace(/:\s*Statement\s*\(I\):/g, ":\nStatement (I):");
    qText = qText.replace(/Given below are two statements:\s*Statement \(I\):/g, "Given below are two statements:\nStatement (I):");
  }
  qText = qText.replace(/^\.\s*/, "");
  let opts=[];
  let optCur = cur;
  for(let k=0;k<4;k++){
    let lIdx = nextNonEmpty(optCur);
    if(lIdx>=lines.length) break;
    let l = lines[lIdx].trim();
    let mm = l.match(/^[1-4]\.\s*(.*)/);
    let optText;
    if(mm){
      optText = (mm[1] || "").trim();
    } else {
      mm = l.match(/^\(([A-D])\)\s*(.*)/);
      if(!mm) break;
      optText = (mm[2] || "").trim();
    }
    if(!optText) break;
    opts.push(optText);
    optCur = lIdx+1;
  }
  if(opts.length!==4){ i=optCur; continue; }
  let ansIdx = nextNonEmpty(optCur);
  if(ansIdx>=lines.length) break;
  const ansLine = lines[ansIdx].trim();
  const ansM = ansLine.match(/Correct Answer:\s*Option\s*([1-4])/) || ansLine.match(/Correct Answer:\s*\(([1-4])\)/);
  let correct;
  if(ansM){
    correct = parseInt(ansM[1],10)-1;
  } else { i=ansIdx+1; continue; }
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
  parsed.push({ qno, qText, opts, correct, explanation });
  i = cur;
}
console.log(`Parsed ${parsed.length} questions`);
const missing=[];
for(let n=1;n<=120;n++) if(!parsed.some(p=>p.qno===n)) missing.push(n);
console.log("missing", missing.length, missing.slice(0,10));
if(parsed.length!==120){ console.error("Not 120"); await prisma.$disconnect(); process.exit(1); }
parsed.sort((a,b)=>a.qno-b.qno);
const test = await prisma.mockTest.create({
  data: { title: TITLE, description: `ICAR AIEEA PG 2025 Veterinary Science — 120 questions with answer key and explanation.`, duration: 120, totalMarks: parsed.length, exam: EXAM, track: TRACK, kind: "PREVIOUS_YEAR", year: YEAR, isDemo: false },
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
