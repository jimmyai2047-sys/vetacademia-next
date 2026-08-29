import "dotenv/config";
import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";
const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\ICAR P.G. Entrance Examination (M.V.Sc & Ph.D.)\\ICAR PG Entrance Examination\\ICAR_Animal_Science_2024_QuestionPaper_with_Answers.docx";
const TITLE = "ICAR AIEEA PG 2024 Animal Science";
const TRACK = "icar-jrf";
const EXAM = "icar-entrance";
const YEAR = "2024";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
let existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
if(existing){ console.log(`Deleting existing ${existing.id}`); await prisma.mockTest.delete({ where: { id: existing.id } }); }
console.log("Parsing ICAR 2024...");
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
  // For ICAR 2024, the question may have statements like "(A). DNA cleavage" on next lines, which are part of the question, not options
  // We should collect all lines until we hit an option line "1. " or "Choose" or "Correct Answer"
  // For Match List, the list items are like "1. Nucleoside – A. UAA" with "1." and "–", should be included
  // For Read the following, the statements are "(A). ...", "(B). ...", etc., should be included
  while(cur < lines.length){
    let lIdx = nextNonEmpty(cur);
    if(lIdx>=lines.length) break;
    const l = lines[lIdx].trim();
    if(l.startsWith("Choose the correct")){ qLines.push(l); cur=lIdx+1; break; }
    if(l.startsWith("Correct Answer:")||l.startsWith("Answer:")||/^Q\.No\./.test(l)) break;
    // Check if it's an option like "1. Morgan" etc., but for Q10, the statements "(A). DNA cleavage" look like options but are actually part of question
    // We need to distinguish: for Q10, after the question "Crossing over involves...", the next lines are "(A). DNA cleavage", "(B). Ligation", etc., which are part of the question's statements, not the final options
    // The final options for Q10 are "1. (A) and (B) only" etc., with "1.", "2.", etc., and containing "(A) and (B)"
    // So we should include "(A). DNA cleavage" as part of qText, but not "1. (A) and (B) only" which is an option
    // How to distinguish? The question's statements are "(A). DNA cleavage" with "(A)." and a short text, while options are "1. (A) and (B) only" with "1." and containing "(A) and (B)"
    // We can check: if the line starts with "(A)." or "(B)." etc., and the question text already contains "which of the following events" or "Read the following", then it's part of question
    // For now, we will include any line that starts with "(A)." or "(B)." etc., as part of qText if the question is of type "Crossing over" or "Read the following" or "Consider the following"
    // Otherwise, it's an option
    const isStatement = /^\([A-D]\)\.\s/.test(l);
    const isOptionNumber = /^[1-4]\.\s/.test(l);
    if(isStatement){
      // Check if this is part of the question's statements or the final options
      // For Q10, the statements are "(A). DNA cleavage" etc., and the options are "1. (A) and (B) only" etc.
      // So if the line starts with "(A)." and the question is of type "Crossing over" or "Read the following", it's part of question
      if(qText.includes("Crossing over") || qText.includes("Read the following") || qText.includes("Consider the following") || qText.includes("which of the following events")){
        qLines.push(l);
        cur=lIdx+1;
        continue;
      }
      // For other questions, "(A)." could be an option, but for ICAR 2024, options are "1.", "2.", etc., not "(A).", so "(A)." should be part of question
      // So we should include it
      // Actually, for ICAR 2024, the final options are "1.", "2.", etc., not "(A).", so any "(A)." line is part of question
      qLines.push(l);
      cur=lIdx+1;
      continue;
    }
    if(isOptionNumber){
      // This could be a list item for Match List ("1. Nucleoside – A. UAA") or an option ("1. (A) and (B) only")
      // For Match List, the line is "1. Nucleoside – A. UAA" with "–" and contains both number and letter
      // For options, the line is "1. (A) and (B) only" with parentheses
      // We need to distinguish
      if(qText.includes("Match List") && l.includes("–")){
        qLines.push(l);
        cur=lIdx+1;
        continue;
      }
      // For regular options, break
      break;
    }
    qLines.push(l);
    cur=lIdx+1;
    let peek = nextNonEmpty(cur);
    if(peek < lines.length){
      const pl = lines[peek].trim();
      if(/^[1-4]\.\s/.test(pl) && !pl.includes("–") && !qText.includes("Match List")) break;
      if(pl.startsWith("Correct Answer:")) break;
    }
    if(qLines.length>10) break;
  }
  qText = qLines.join("\n").trim();
  // Handle Match List formatting
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
    if(tableRows.length===4){
      const newLines = [header, "List–I  →  List–II"];
      for(const row of tableRows){
        newLines.push(`${row[0]}  →  ${row[1]}`);
      }
      if(chooseLine) newLines.push(chooseLine);
      qText = newLines.join("\n");
    }
  }
  // Handle "Choose the correct" already included, but ensure statements are each on new line
  if(qText.includes("(A)") && qText.includes("(B)") && !qText.includes("\n(A)")){
    const idxA = qText.indexOf(" (A)");
    if(idxA!==-1){
      const before = qText.slice(0, idxA).trim();
      const after = qText.slice(idxA).trim();
      const stmts=[];
      const re = /\(([A-D])\)\s*([^\(]*?)(?=\s*\([A-D]\)|$)/g;
      let m;
      while((m=re.exec(after))!==null){
        stmts.push(`(${m[1]}) ${m[2].trim()}`);
      }
      if(stmts.length===4){
        qText = before + "\n" + stmts.join("\n");
        const chooseIdx = after.indexOf("Choose the correct");
        if(chooseIdx!==-1){
          const choosePart = after.slice(chooseIdx).trim();
          if(!qText.includes("Choose the correct")){
            qText += "\n" + choosePart;
          }
        }
      }
    }
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
  const ansM = ansLine.match(/Correct Answer:\s*Option\s*([1-4])/) || ansLine.match(/Correct Answer:\s*\(([1-4])\)/) ;
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
  data: { title: TITLE, description: `ICAR AIEEA PG 2024 Animal Science — 120 questions with answer key and explanation.`, duration: 120, totalMarks: parsed.length, exam: EXAM, track: TRACK, kind: "PREVIOUS_YEAR", year: YEAR, isDemo: false },
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
