import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import mammoth from "mammoth";
import { normalize } from "./normalize.mjs";

// Use the CORRECTLY FORMATTED mock doc we just generated (List I/II separate, A/B separate, Statement separate)
const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\ICAR P.G. Entrance Examination (M.V.Sc & Ph.D.)\\ICAR PG Entrance Examination\\ICAR_Veterinary_Science_2023_MOCK_TEST_JRF_PYP_Format.docx";
const TITLE = "ICAR AIEEA PG 2023 Veterinary Science";
const TRACK = "icar-jrf-srf"; // correct label per exam-tracks.ts (shows as ICAR-JRF/SRF). Legacy used "icar-jrf" but this is proper
const EXAM = "icar-entrance";
const YEAR = "2023";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

let existing = await prisma.mockTest.findFirst({ where: { title: TITLE } });
if (existing) {
  console.log(`Deleting existing ${existing.id} (${existing.title}) with ${existing.year}`);
  await prisma.mockTest.delete({ where: { id: existing.id } });
  console.log("Deleted existing");
}

console.log(`Parsing ${DOCX_PATH} ...`);
const { value } = await mammoth.extractRawText({ path: DOCX_PATH });
let txt = value.replace(/\r/g, "");
let rawLines = txt.split("\n");
let lines = rawLines.map(l => l.replace(/\u00A0/g, " ").trimEnd());

function nextNonEmpty(idx) {
  while (idx < lines.length && lines[idx].trim() === "") idx++;
  return idx;
}

const parsed = [];
let i = 0;
while (i < lines.length) {
  let idx = nextNonEmpty(i);
  if (idx >= lines.length) break;
  const line = lines[idx].trim();
  const m0 = line.match(/^Q\. No\.\s*0*(\d+)\s*(.*)/);
  if (!m0) { i = idx + 1; continue; }
  const qno = parseInt(m0[1], 10);
  let firstRemain = m0[2].trim();
  let qLines = [];
  if (firstRemain) qLines.push(firstRemain);
  let cur = idx + 1;
  // Collect question lines until options
  while (cur < lines.length) {
    let lIdx = nextNonEmpty(cur);
    if (lIdx >= lines.length) break;
    const l = lines[lIdx].trim();
    if (/^[1-4]\)\.\s/.test(l) || /^Correct Answer:/.test(l) || /^Q\. No\./.test(l)) break;
    qLines.push(l);
    cur = lIdx + 1;
  }
  let qText = qLines.join("\n").trim();
  // Normalize some artifacts
  // Ensure List I/II etc are preserved as lines already
  // Options
  let opts = [];
  let optCur = cur;
  for (let k = 0; k < 4; k++) {
    let lIdx = nextNonEmpty(optCur);
    if (lIdx >= lines.length) break;
    let l = lines[lIdx].trim();
    let mm = l.match(/^[1-4]\)\.\s*(.*)/);
    if (!mm) {
      // fallback to 1. pattern
      mm = l.match(/^[1-4]\.\s*(.*)/);
      if (!mm) break;
    }
    opts.push(mm[1].trim());
    optCur = lIdx + 1;
  }
  if (opts.length !== 4) {
    console.log(`Q${qno} opts not 4, got ${opts.length}, skipping`);
    i = optCur;
    continue;
  }
  let ansIdx = nextNonEmpty(optCur);
  if (ansIdx >= lines.length) break;
  const ansLine = lines[ansIdx].trim();
  // Correct Answer: X). text  or Correct Answer: X
  let correct = null;
  let ansM = ansLine.match(/^Correct Answer:\s*(\d+)\)\.\s*/);
  if (ansM) correct = parseInt(ansM[1], 10) - 1;
  else {
    ansM = ansLine.match(/^Correct Answer:\s*(\d+)/);
    if (ansM) correct = parseInt(ansM[1], 10) - 1;
  }
  if (correct === null || correct < 0 || correct > 3) {
    console.log(`Q${qno} correct not found: ${ansLine}`);
    i = ansIdx + 1;
    continue;
  }
  let explanation = "";
  // Explanation may be on same line after Correct Answer or next line
  const expIdx = ansLine.indexOf("Explanation:");
  if (expIdx !== -1) {
    explanation = ansLine.slice(expIdx + 12).trim();
    // If explanation continues on next lines until next Q
    let next = ansIdx + 1;
    let peek = nextNonEmpty(next);
    if (peek < lines.length) {
      const pl = lines[peek].trim();
      if (!pl.startsWith("Q. No.") && !pl.startsWith("Correct Answer:") && !/^[1-4]\)\./.test(pl)) {
        // Check if next line is pure explanation continuation (not Q)
        // In mock doc, explanation is usually same line, but sometimes next line? Here it's single line.
        // We'll gather until next Q if explanation looks short and next line not Q?
        // For now keep single line
      }
    }
    i = ansIdx + 1;
  } else {
    let eIdx = nextNonEmpty(ansIdx + 1);
    if (eIdx < lines.length && lines[eIdx].trim().startsWith("Explanation:")) {
      explanation = lines[eIdx].trim().replace(/^Explanation:\s*/, "").trim();
      i = eIdx + 1;
    } else {
      i = ansIdx + 1;
    }
  }
  parsed.push({ qno, qText, opts, correct, explanation });
  // i already set
}

console.log(`Parsed ${parsed.length} questions`);
const missing = [];
for (let n = 1; n <= 120; n++) if (!parsed.some(p => p.qno === n)) missing.push(n);
console.log("missing", missing.length, missing.slice(0, 20));
if (parsed.length !== 120) {
  console.error(`Expected 120, got ${parsed.length}`);
  await prisma.$disconnect();
  process.exit(1);
}
parsed.sort((a, b) => a.qno - b.qno);

// Verify some samples
for (const s of [1,2,3,4,28,54]) {
  const p = parsed.find(x=>x.qno===s);
  if(p) console.log(`Q${s} text preview:\n${p.qText.slice(0,300)}\n opts=${JSON.stringify(p.opts.slice(0,2))} correct=${p.correct}\n---`);
}

const test = await prisma.mockTest.create({
  data: {
    title: TITLE,
    description: `ICAR AIEEA PG 2023 Veterinary Science — Previous Year Paper (JRF) | 120 Questions with Answer Key & Explanations | Properly arranged Mock Test format: List I/II separate blocks, A/B/C/D & Statement I/II on individual lines, options 1).–4).`,
    duration: 120,
    totalMarks: parsed.length,
    exam: EXAM,
    track: TRACK,
    kind: "PREVIOUS_YEAR",
    year: YEAR,
    isDemo: false,
  },
});
console.log(`Created MockTest ${test.id} : ${test.title}`);

for (let idx = 0; idx < parsed.length; idx++) {
  const p = parsed[idx];
  await prisma.question.create({
    data: {
      text: normalize(p.qText, "\n"),
      options: JSON.stringify(p.opts.map(o => normalize(o, " / "))),
      correctAnswer: p.correct,
      marks: 1,
      difficulty: 2,
      explanation: p.explanation ? normalize(p.explanation, " ") : null,
      mockTestId: test.id,
      createdAt: new Date(Date.now() + idx * 1000),
    },
  });
  if ((idx + 1) % 30 === 0) console.log(`  inserted ${idx + 1}/${parsed.length}`);
}
console.log(`Ingested ${parsed.length} questions into ${TITLE} (${YEAR})`);
await prisma.$disconnect();
