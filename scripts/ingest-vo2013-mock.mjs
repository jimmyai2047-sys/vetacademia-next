// Ingest VO 2013 as MockTest (Previous Year Paper) with answer key + explanation
// Combines: PDF question paper (via Gemini vision) + docx answer key (mammoth)
// Run when Gemini quota available: node scripts/ingest-vo2013-mock.mjs
import "dotenv/config";
import fs from "fs";
import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pdf as pdfToImage } from "pdf-to-img";
import { normalize } from "./normalize.mjs";

const PDF_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\State Public Service Commission\\Veterinary Officer (V.O.)\\Previous Year Papers\\V.O. 2013.pdf";
const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\State Public Service Commission\\Veterinary Officer (V.O.)\\Previous Year Papers\\VO_2013_Answer_Key_with_Explanation_English.docx";
const TITLE = "Veterinary Officer (V.O.) Previous Year Paper 2013";
const TRACK = "veterinary-officer";
const EXAM = "psc";
const YEAR = "2013";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const PAGES_PER_CALL = parseInt(process.env.PAGES_PER_CALL || "8", 10);
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error("Set GEMINI_API_KEY"); process.exit(1); }
const genAI = new GoogleGenerativeAI(API_KEY);

const PROMPT = `You are extracting multiple-choice questions from competitive exam (Veterinary Officer) question-booklet pages. These pages may be in English, Hindi, or a mix.
For EVERY question on the provided page image(s), extract:
- question: the full question text, preserving the original language (do not translate). Include any sub-parts or codes shown.
- options: an array of the option texts, in order (typically 4: A, B, C, D). Preserve original language.
- section: the subject/section heading if visible on the page (e.g. "Veterinary Science"), else null.
Rules:
- Do NOT invent answer keys. Output only questions/options.
- Do NOT add any numbering (no "1)", "2)", "A)", "B)" etc.) to the question text or to any option. The app adds those.
- For BOTH question and each option: if the paper shows English and Hindi, put the HINDI text FIRST, then the English text on the next line (use a real newline, not " / "). If only one language is present, output just that language.
- Keep options exactly as printed; if an option has no text, use "" .
- Output only via the provided tool. Extract every question; do not skip any.
- If a question is split across pages, include it under the page where it mostly appears.
- Ignore instructions, headers/footers, candidate details, and answer-grid tables.`;

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: { type: "OBJECT", properties: { question: { type: "STRING" }, options: { type: "ARRAY", items: { type: "STRING" } }, section: { type: "STRING" } }, required: ["question", "options"] },
};

async function extractBatch(images) {
  const model = genAI.getGenerativeModel({ model: MODEL, generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA } });
  const parts = [{ text: PROMPT }];
  for (const img of images) parts.push({ inlineData: { mimeType: "image/png", data: img.toString("base64") } });
  const result = await model.generateContent({ contents: [{ role: "user", parts }] });
  const text = result.response.text();
  try { const p = JSON.parse(text); return Array.isArray(p) ? p : p.questions || []; } catch { console.error("  JSON parse failed", text.slice(0,200)); return []; }
}

async function parseAnswerKey(docxPath) {
  const { value } = await mammoth.extractRawText({ path: docxPath });
  const lines = value.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);
  let start = lines.findIndex(l=>l==="Q.No.");
  const map = new Map();
  for (let i = start+3; i < lines.length;) {
    const qno = lines[i];
    if (!/^\d+$/.test(qno)) { i++; continue; }
    const ans = lines[i+1] || "";
    const exp = lines[i+2] || "";
    const m = ans.match(/^\((\d+)\)/);
    const correct = m ? parseInt(m[1],10)-1 : -1;
    // ans text after "(N) " is the correct option text; explanation is exp
    map.set(parseInt(qno,10), { correct, explanation: exp, ansText: ans });
    i+=3;
  }
  console.log(`Parsed answer key: ${map.size} entries`);
  return map;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
  if (existing) { console.log(`MockTest already exists [${existing.id}] ${TITLE} — skipping. Delete it first to re-ingest.`); await prisma.$disconnect(); return; }

  const answerMap = await parseAnswerKey(DOCX_PATH);
  console.log("Loading PDF and rendering pages...");
  const buf = fs.readFileSync(PDF_PATH);
  const pages = [];
  const doc = await pdfToImage(buf, { density: 100 });
  for await (const page of doc) pages.push(page);
  console.log(`Rendered ${pages.length} pages. Extracting via ${MODEL}...`);

  const all = [];
  const seen = new Set();
  for (let i=0; i<pages.length; i+=PAGES_PER_CALL) {
    const batch = pages.slice(i, i+PAGES_PER_CALL);
    const batchNo = Math.floor(i/PAGES_PER_CALL)+1;
    try {
      const qs = await extractBatch(batch);
      let added=0;
      for (const q of qs) {
        const norm = (q.question||"").trim().replace(/\s+/g," ").toLowerCase().slice(0,120);
        if (!norm || seen.has(norm)) continue;
        seen.add(norm); all.push(q); added++;
      }
      console.log(`  batch ${batchNo}: extracted ${qs.length}, new ${added}`);
    } catch(e) { console.error(`  batch ${batchNo} FAILED: ${e?.message||e}`); }
  }
  console.log(`TOTAL unique questions extracted: ${all.length}`);
  if (all.length===0) { console.log("No questions — aborting."); await prisma.$disconnect(); return; }
  if (all.length !== answerMap.size) console.warn(`WARN: extracted ${all.length} vs answer key ${answerMap.size} entries — alignment by order, some may mismatch.`);

  const test = await prisma.mockTest.create({
    data: { title: TITLE, description: `VO 2013 previous year paper with answer key and explanation. ${all.length} questions.`, duration: 120, totalMarks: all.length, exam: EXAM, track: TRACK, kind: "PREVIOUS_YEAR", year: YEAR, isDemo: false },
  });
  console.log(`Created MockTest ${test.id}`);

  const rows = all.map((q, idx) => {
    const qno = idx+1;
    const ak = answerMap.get(qno);
    return {
      text: normalize(q.question||"", "\n"),
      options: JSON.stringify((q.options||[]).map(o=>normalize(o, " / "))),
      correctAnswer: ak ? ak.correct : -1,
      marks: 1,
      difficulty: 2,
      explanation: ak ? ak.explanation : (q.section ? `Section: ${q.section}` : null),
      mockTestId: test.id,
    };
  });
  await prisma.question.createMany({ data: rows });
  console.log(`Ingested ${rows.length} questions with answer key.`);
  await prisma.$disconnect();
}
main().catch(e=>{ console.error("Fatal:", e); process.exit(1); });
