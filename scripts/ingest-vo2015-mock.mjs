import "dotenv/config";
import fs from "fs";
import mammoth from "mammoth";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalize } from "./normalize.mjs";

const PDF_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\State Public Service Commission\\Veterinary Officer (V.O.)\\Previous Year Papers\\V.O. 2015 (Animal Husbandry).pdf";
const DOCX_PATH = "D:\\Preparation for Competitive Examinations\\Examination\\State Public Service Commission\\Veterinary Officer (V.O.)\\Previous Year Papers\\VO_2015_Question_Paper_with_Answer_Key_CrossChecked.docx";
const TITLE = "Veterinary Officer (V.O.) Previous Year Paper 2015 (Animal Husbandry)";
const TRACK = "veterinary-officer";
const EXAM = "psc";
const YEAR = "2015";
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 1) Ensure Post (PYP PDF) exists
const pdfFile = "V.O. 2015 (Animal Husbandry).pdf";
let post = await prisma.post.findFirst({ where: { category: "PREVIOUS_YEAR", track: TRACK, fileName: pdfFile } });
if (!post) {
  console.log("Creating Post for VO 2015 PYP PDF...");
  const size = fs.statSync(PDF_PATH).size;
  const safeName = pdfFile.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blobPath = `uploads/${Date.now()}-${safeName}`;
  const buffer = fs.readFileSync(PDF_PATH);
  const blob = await put(blobPath, buffer, { access: "private", token: TOKEN, addRandomSuffix: false, multipart: true, contentType: "application/pdf" });
  post = await prisma.post.create({
    data: {
      title: TITLE,
      category: "PREVIOUS_YEAR",
      content: `Veterinary Officer (V.O.) previous year question paper — ${pdfFile}.`,
      exam: EXAM,
      track: TRACK,
      published: true,
      fileUrl: blob.url,
      fileName: pdfFile,
      fileType: "PDF",
      fileSize: size,
    },
  });
  console.log(`Created Post [${post.id}] ${TITLE}`);
} else {
  console.log(`Post already exists [${post.id}] ${post.title}`);
}

// 2) Check MockTest exists
let existing = await prisma.mockTest.findFirst({ where: { title: TITLE, kind: "PREVIOUS_YEAR" } });
if (existing) {
  console.log(`MockTest already exists [${existing.id}] ${TITLE} — skipping. Delete it first to re-ingest.`);
  await prisma.$disconnect();
  process.exit(0);
}

// 3) Parse docx
console.log("Parsing docx...");
const { value } = await mammoth.extractRawText({ path: DOCX_PATH });
const txt = value.replace(/\r/g,"");
const re = /(\d+)\.\s+([\s\S]*?)\s+\(1\)\s*([^\n]+)\s+\(2\)\s*([^\n]+)\s+\(3\)\s*([^\n]+)\s+\(4\)\s*([^\n]+)\s+Answer:\s*\((\d+)\)[^\n]*\s+Explanation:\s*([\s\S]*?)(?=\s*\d+\.\s+|$)/g;
const parsed = [];
let m;
while ((m = re.exec(txt)) !== null) {
  parsed.push({
    qno: parseInt(m[1],10),
    question: m[2].trim(),
    opts: [m[3].trim(), m[4].trim(), m[5].trim(), m[6].trim()],
    correct: parseInt(m[7],10)-1,
    explanation: m[8].trim(),
  });
}
console.log(`Parsed ${parsed.length} questions from docx`);
if (parsed.length === 0) { console.error("No questions parsed — check regex"); await prisma.$disconnect(); process.exit(1); }
parsed.sort((a,b)=>a.qno-b.qno);

// 4) Create MockTest
const test = await prisma.mockTest.create({
  data: {
    title: TITLE,
    description: `VO 2015 (Animal Husbandry) previous year paper with answer key and explanation. ${parsed.length} questions.`,
    duration: 120,
    totalMarks: parsed.length,
    exam: EXAM,
    track: TRACK,
    kind: "PREVIOUS_YEAR",
    year: YEAR,
    isDemo: false,
  },
});
console.log(`Created MockTest ${test.id}`);

const rows = parsed.map(p => ({
  text: normalize(p.question, "\n"),
  options: JSON.stringify(p.opts.map(o=>normalize(o, " / "))),
  correctAnswer: p.correct,
  marks: 1,
  difficulty: 2,
  explanation: p.explanation,
  mockTestId: test.id,
}));
await prisma.question.createMany({ data: rows });
console.log(`Ingested ${rows.length} questions with answer key & explanation.`);
await prisma.$disconnect();
