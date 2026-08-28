import "dotenv/config";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pdf as pdfToImage } from "pdf-to-img";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { normalize } from "./normalize.mjs";

// ---------- Config (env-driven) ----------
const TITLE = process.env.TITLE || "LSA Previous Year Paper";
const TRACK = process.env.TRACK || "livestock-assistant"; // livestock-assistant | veterinary-officer
const EXAM = process.env.EXAM || "psc";
const YEAR = process.env.YEAR || null;
const SOURCE = process.env.SOURCE; // local path OR blob https URL
const DRY_RUN = process.env.DRY_RUN !== "false"; // default dry-run (no DB write)
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const PAGES_PER_CALL = parseInt(process.env.PAGES_PER_CALL || "8", 10);
const API_KEY = process.env.GEMINI_API_KEY;

if (!SOURCE) {
  console.error("Set SOURCE (local path or blob https URL).");
  process.exit(1);
}
if (!API_KEY) {
  console.error("Set GEMINI_API_KEY in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function resolvePdfBuffer(src) {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    let url = src;
    if (src.includes("blob.vercel-storage.com")) {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      const pathname = new URL(src).pathname.replace(/^\//, "");
      const validUntil = Date.now() + 60 * 60 * 1000;
      const signedToken = await issueSignedToken({
        token,
        pathname,
        operations: ["get"],
        validUntil,
      });
      const { presignedUrl } = await presignUrl(signedToken, {
        operation: "get",
        pathname,
        access: "private",
      });
      url = presignedUrl;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFileSync(src);
}

const PROMPT = `You are extracting multiple-choice questions from competitive exam (LSA / Veterinary Officer) question-booklet pages. These pages may be in English, Hindi, or a mix.

For EVERY question on the provided page image(s), extract:
- question: the full question text, preserving the original language (do not translate). Include any sub-parts or codes shown.
- options: an array of the option texts, in order (typically 4: A, B, C, D). Preserve original language.
- section: the subject/section heading if visible on the page (e.g. "Animal Nutrition"), else null.

Rules:
- Do NOT invent or include answer keys / correct options. This is practice-only.
- Do NOT add any numbering (no "1)", "2)", "A)", "B)" etc.) to the question text or to any option. The app adds question numbers and A/B/C/D labels itself.
- For BOTH question and each option: if the paper shows English and Hindi, put the HINDI text FIRST, then the English text on the next line (use a real newline, not " / "). If only one language is present, output just that language.
- Keep options exactly as printed; if an option has no text, use "" .
- Output only via the provided tool. Extract every question; do not skip any.
- If a question is split across pages, include it under the page where it mostly appears.
- Ignore instructions, headers/footers, candidate details, and answer-grid tables.`;

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      question: { type: "STRING" },
      options: { type: "ARRAY", items: { type: "STRING" } },
      section: { type: "STRING" },
    },
    required: ["question", "options"],
  },
};

async function extractBatch(images) {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });
  const parts = [{ text: PROMPT }];
  for (const img of images) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: img.toString("base64"),
      },
    });
  }
  const result = await model.generateContent({ contents: [{ role: "user", parts }] });
  const text = result.response.text();
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : parsed.questions || [];
  } catch {
    console.error("  batch JSON parse failed:", text.slice(0, 200));
    return [];
  }
}

function yearFromText(s) {
  const m = (s || "").match(/(\d{4})/);
  return m ? m[1] : null;
}

async function processPaper({ source, title, track, exam, year }) {
  console.log(`\n===== ${title} =====`);
  console.log(`Loading PDF from ${source} ...`);
  const pdfBuffer = await resolvePdfBuffer(source);
  console.log(`Rendering pages (density 100)...`);
  const pages = [];
  const doc = await pdfToImage(pdfBuffer, { density: 100 });
  for await (const page of doc) {
    pages.push(page);
  }
  console.log(`Rendered ${pages.length} pages. Extracting via ${MODEL}...`);

  const all = [];
  const seen = new Set();
  for (let i = 0; i < pages.length; i += PAGES_PER_CALL) {
    const batch = pages.slice(i, i + PAGES_PER_CALL);
    const batchNo = Math.floor(i / PAGES_PER_CALL) + 1;
    try {
      const qs = await extractBatch(batch);
      let added = 0;
      for (const q of qs) {
        const norm = (q.question || "").trim().replace(/\s+/g, " ").toLowerCase().slice(0, 120);
        if (!norm || seen.has(norm)) continue;
        seen.add(norm);
        all.push(q);
        added++;
      }
      console.log(`  batch ${batchNo}: extracted ${qs.length}, new ${added}`);
    } catch (e) {
      console.error(`  batch ${batchNo} FAILED: ${e?.message || e}`);
    }
  }

  console.log(`TOTAL unique questions extracted: ${all.length}`);
  if (all.length === 0) {
    console.log("No questions extracted — skipping ingest.");
    return 0;
  }

   if (DRY_RUN) {
    console.log("Sample (first 2, normalized):");
    for (const q of all.slice(0, 2)) {
      const qn = normalize(q.question || "", "\n");
      const on = (q.options || []).map((o) => normalize(o, " / "));
      console.log(`- ${qn.slice(0, 100)}`);
      console.log(`  options(${on.length}): ${on.map((o) => o.slice(0, 30)).join(" | ")}`);
    }
    console.log("DRY_RUN=true → no database write. Set DRY_RUN=false to ingest.");
    return all.length;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const test = await prisma.mockTest.create({
    data: {
      title,
      description: `Previous year paper (practice). ${all.length} questions extracted via AI; no answer key.`,
      duration: year && Number(year) >= 2024 ? 180 : 120,
      totalMarks: all.length,
      exam,
      track,
      kind: "PREVIOUS_YEAR",
      year: year || null,
      isDemo: false,
    },
  });
  await prisma.question.createMany({
    data: all.map((q) => ({
      text: normalize(q.question || "", "\n"),
      options: JSON.stringify((q.options || []).map((o) => normalize(o, " / "))),
      correctAnswer: -1,
      marks: 1,
      difficulty: 2,
      explanation: q.section ? `Section: ${q.section}` : null,
      mockTestId: test.id,
    })),
  });
  console.log(`INGESTED → MockTest ${test.id} with ${all.length} questions.`);
  await prisma.$disconnect();
  return all.length;
}

async function main() {
  if (SOURCE.startsWith("db:")) {
    const track = SOURCE.slice(3);
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaClient({ adapter });
    const posts = await prisma.post.findMany({
      where: { category: "PREVIOUS_YEAR", track },
      select: { title: true, fileUrl: true, fileName: true },
      orderBy: { createdAt: "asc" },
    });
    if (posts.length === 0) {
      console.log(`No PREVIOUS_YEAR posts found for track=${track}`);
      await prisma.$disconnect();
      return;
    }
    let total = 0;
    for (const p of posts) {
      if (!p.fileUrl) continue;
      const existing = await prisma.mockTest.findFirst({
        where: { title: p.title, kind: "PREVIOUS_YEAR" },
      });
      if (existing) {
        console.log(`SKIP (already ingested): ${p.title}`);
        continue;
      }
      total += await processPaper({
        source: p.fileUrl,
        title: p.title,
        track,
        exam: EXAM,
        year: yearFromText(p.fileName || p.title),
      });
    }
    await prisma.$disconnect();
    console.log(`\nALL DONE. Total questions ingested this run: ${total}`);
    return;
  }

  await processPaper({ source: SOURCE, title: TITLE, track: TRACK, exam: EXAM, year: YEAR });
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
