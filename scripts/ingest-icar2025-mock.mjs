import "dotenv/config";
import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";

const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\ICAR P.G. Entrance Examination (M.V.Sc & Ph.D.)\\ICAR PG Entrance Examination\\ICAR_AIEEA_PG_2025_Animal_Science_QuestionPaper.docx";
const TITLE = "ICAR AIEEA PG 2025 Animal Science — Question Paper with Answer & Explanation";
const TRACK = "icar-jrf";
const EXAM = "icar-entrance";
const YEAR = "2025";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

let existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
if (existing) { console.log(`MockTest already exists [${existing.id}] — skipping`); await prisma.$disconnect(); process.exit(0); }

console.log("Parsing ICAR 2025 docx...");
const { value } = await mammoth.extractRawText({ path: DOCX_PATH });
let txt = value.replace(/\r/g,"");
let rawLines = txt.split("\n");
let lines=[];
for(const l of rawLines) lines.push(l);
function nextNonEmpty(idx){ while(idx < lines.length && lines[idx].trim()==="") idx++; return idx; }

function formatMatchListInText(qText){
  if(!qText.includes("Match List")) return qText;
  // qText is like "Match List-I with List-IIList-I (Trait/Characteristic): (A) Heritability of Egg Weight, (B) ...List-II (Estimate/Range): (I) 0.01-0.83, (II) ..."
  // We want to split into List-I and List-II and format as table
  // Find List-I and List-II parts
  const listIMatch = qText.match(/List\s*-\s*I\s*[:\-]?\s*(.*?)\s*List\s*-\s*II\s*[:\-]?\s*(.*)/s);
  if(!listIMatch) return qText;
  const listIPart = listIMatch[1].trim(); // " (Trait/Characteristic): (A) Heritability of Egg Weight, (B) ..."
  const listIIPart = listIMatch[2].trim(); // "(Estimate/Range): (I) 0.01-0.83, (II) ..."
  // Extract header and items
  // For List-I, header is like "(Trait/Characteristic):" and items are "(A) Heritability of Egg Weight, (B) ..."
  // We should keep the header as is, but format items as table rows
  // Simpler: keep the original qText but insert line breaks for items to be handled by QuestionText
  // The QuestionText will handle "A. ... → I. ..." style, but here the format is different
  // For now, we can just ensure the List-I and List-II items are on separate lines with "→" separator for the table
  // We can parse List-I items: split by "(A)", "(B)", etc.
  const parseItems = (content, isListII) => {
    const items=[];
    const markers = isListII ? ["(I)", "(II)", "(III)", "(IV)"] : ["(A)", "(B)", "(C)", "(D)"];
    // Use regex to find each marker
    const re = new RegExp(`\\(${isListII ? "I{1,3}V?|IV" : "[A-D]"}\\)\\s*([^\\(]*?)(?=\\s*\\((?:${isListII ? "I{1,3}V?|IV" : "[A-D]"})\\)|$)`, "g");
    // Simpler: split by marker
    // For List-I: markers are "(A)", "(B)", "(C)", "(D)"
    // For List-II: markers are "(I)", "(II)", "(III)", "(IV)"
    let m;
    const markerRe = isListII ? /\((I{1,3}V?|IV)\)\s*/g : /\(([A-D])\)\s*/g;
    const parts = [];
    let lastIdx=0;
    let lastMarker="";
    // Find all markers
    const markerList=[];
    let mm;
    const re2 = isListII ? /\((I{1,3}V?|IV)\)\s*/g : /\(([A-D])\)\s*/g;
    while((mm=re2.exec(content))!==null){
      markerList.push({ marker: mm[1], index: mm.index, full: mm[0] });
    }
    for(let i=0;i<markerList.length;i++){
      const start = markerList[i].index + markerList[i].full.length;
      const end = i+1<markerList.length ? markerList[i+1].index : content.length;
      const text = content.slice(start, end).trim().replace(/,\s*$/, "").trim();
      if(text) items.push(`(${markerList[i].marker}) ${text}`);
    }
    return items;
  };
  const isListIIRoman = listIIPart.trim().startsWith("(") && /\(I\)/.test(listIIPart);
  const listIItems = parseItems(listIContent, false);
  const listIIItems = parseItems(listIIContent, true);
  // This is getting too complex for a quick fix
  return qText;
}

const parsed=[];
let i=0;
while (i < lines.length) {
  let idx = nextNonEmpty(i);
  if (idx>=lines.length) break;
  const line = lines[idx].trim();
  const m0 = line.match(/^Q\.No\.\s*0*(\d+)\s*(.*)/);
  if (!m0) { i=idx+1; continue; }
  const qno = parseInt(m0[1],10);
  let qText = m0[2].trim();
  let qLines=[qText];
  let cur = idx+1;
  while (cur < lines.length) {
    let lIdx = nextNonEmpty(cur);
    if(lIdx>=lines.length) break;
    const l = lines[lIdx].trim();
    if (/^\(A\)/.test(l) || l.startsWith("Answer:") || /^Q\.No\./.test(l)) break;
    qLines.push(l);
    cur = lIdx+1;
    let peek = nextNonEmpty(cur);
    if (peek < lines.length && /^\([A-D]\)/.test(lines[peek].trim())) break;
    if (qLines.length>6) break;
  }
  qText = qLines.join(" ").trim();
  // For Match List, the qText may contain both List-I and List-II on one line, we should keep it as is for now
  // The QuestionText will handle the display as a table if it contains "→" - but currently it doesn't have "→"
  // We need to ensure the list is formatted with "→" for the table
  // For now, we will leave it as is, and the QuestionText will not create a table for it, but the raw text already has List-I and List-II on one line
  // We should try to format it with "→" for the table
  if(qText.includes("Match List")){
    // Try to format List-I and List-II as table rows
    // The qText is like "Match List-I with List-IIList-I (Trait/Characteristic): (A) Heritability of Egg Weight, (B) ...List-II (Estimate/Range): (I) 0.01-0.83, (II) ..."
    // We should split into List-I and List-II and create rows
    // For now, we will just keep it as is, and the QuestionText's list handling for "→" won't apply, so it will be plain text
    // We should at least ensure the List-I and List-II items are on separate lines for readability
    // We can insert line breaks before each "(A)", "(B)", etc. and "(I)", "(II)", etc.
    // But for now, we will leave it
  }
  let opts=[];
  let optCur = cur;
  for(let k=0;k<4;k++){
    let lIdx = nextNonEmpty(optCur);
    if(lIdx>=lines.length) break;
    let l = lines[lIdx].trim();
    // Options are like "(A) (A)-(II), (B)-(I), (C)-(III), (D)-(IV)" - but in this file, options are on separate lines each with "(A) ...", "(B) ...", etc., where each option is a code like "(A)-(II), (B)-(I), ..."
    // Actually, the options are like "(A) (A)-(II), (B)-(I), (C)-(III), (D)-(IV)" - no, that's not right
    // Let's check the raw for Q11's options: they are "(A) (A)-(II), (B)-(I), (C)-(III), (D)-(IV)" on one line? No, in the raw we saw:
    // "(A) (A)-(II), (B)-(I), (C)-(III), (D)-(IV)"
    // "(B) (A)-(I), (B)-(IV), (C)-(III), (D)-(II)"
    // So each option line starts with "(A)" as the option label, and then the code
    const mm = l.match(/^\(([A-D])\)\s*(.*)/);
    if(!mm) break;
    opts.push(mm[2].trim());
    optCur = lIdx+1;
  }
  if(opts.length!==4){ i=optCur; continue; }
  let ansIdx = nextNonEmpty(optCur);
  if(ansIdx>=lines.length) break;
  const ansLine = lines[ansIdx].trim();
  const ansM = ansLine.match(/Correct Answer:\s*\(([A-D])\)/);
  if(!ansM){ i=ansIdx+1; continue; }
  const correct = ansM[1].charCodeAt(0)-65;
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
  data: { title: TITLE, description: `ICAR AIEEA PG 2025 Animal Science — 120 questions with answer key and explanation.`, duration: 120, totalMarks: parsed.length, exam: EXAM, track: TRACK, kind: "PREVIOUS_YEAR", year: YEAR, isDemo: false },
});
console.log(`Created MockTest ${test.id}`);
for(let idx=0; idx<parsed.length; idx++){
  const p = parsed[idx];
  // For Match List, format the question text to have proper list table
  let qText = p.qText;
  if(qText.includes("Match List")){
    // Try to split List-I and List-II and format as table rows
    // The qText is like "Match List-I with List-IIList-I (Trait/Characteristic): (A) Heritability...List-II (Estimate/Range): (I) 0.01-0.83..."
    // We should insert line breaks and "→" for the table
    // Find List-I and List-II
    const listIMatch = qText.match(/List\s*-\s*I\s*[:\-]?\s*(.*?)\s*List\s*-\s*II\s*[:\-]?\s*(.*)/s);
    if(listIMatch){
      const listIContent = listIMatch[1].trim();
      const listIIContent = listIMatch[2].trim();
      // Parse each
      const parseList = (content, isRoman) => {
        const items=[];
        const re = isRoman ? /\((I{1,3}V?|IV)\)\s*([^\(]*?)(?=\s*\((?:I{1,3}V?|IV)\)|$)/g : /\(([A-D])\)\s*([^\(]*?)(?=\s*\([A-D]\)|$)/g;
        let m;
        while((m=re.exec(content))!==null){
          items.push(`(${m[1]}) ${m[2].trim()}`);
        }
        return items;
      };
      const listIItems = parseList(listIContent, false);
      const listIIItems = parseList(listIIContent, true);
      if(listIItems.length===4 && listIIItems.length===4){
        const header = "Match List - I with List - II.";
        const newLines = [header, "List–I  →  List–II"];
        for(let i=0;i<4;i++) newLines.push(`${listIItems[i]}  →  ${listIIItems[i]}`);
        qText = newLines.join("\n");
      }
    }
  }
  await prisma.question.create({
    data: {
      text: normalize(qText, "\n"),
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
