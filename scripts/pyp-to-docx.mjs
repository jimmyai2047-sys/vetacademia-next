// Convert a PYP (Previous Year Paper) from PDF or image into a Word (.docx) file
// with questions in sequence: Q.no -> Hindi/English lines -> A/B/C/D options -> blank Answer/Explanation.
//
// Usage:
//   SOURCE="path-or-url.pdf|png|jpg" TITLE="LSA 2016" OUT="out.docx" [DRY_RUN=true] node scripts/pyp-to-docx.mjs
//
// Needs GEMINI_API_KEY in .env (vision extraction of questions/options from the page).
import "dotenv/config";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pdf as pdfToImage } from "pdf-to-img";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { normalize } from "./normalize.mjs";

const SOURCE = process.env.SOURCE;
const TITLE = process.env.TITLE || "PYP Questions";
const OUT = process.env.OUT || "pyp-questions.docx";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const PAGES_PER_CALL = parseInt(process.env.PAGES_PER_CALL || "8", 10);
const API_KEY = process.env.GEMINI_API_KEY;
const DRY_RUN = process.env.DRY_RUN === "true";

if (!SOURCE) {
  console.error("Set SOURCE (local path or blob/https URL to a PDF or image).");
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
- Do NOT invent or include answer keys / correct options. This is for a worksheet.
- Do NOT add any numbering (no "1)", "2)", "A)", "B)" etc.) to the question text or to any option. The worksheet adds question numbers and A/B/C/D labels itself.
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
    parts.push({ inlineData: { mimeType: "image/png", data: img.toString("base64") } });
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

async function getImages(src) {
  const buf = await resolvePdfBuffer(src);
  if (buf.slice(0, 4).toString() === "%PDF") {
    const pages = [];
    const doc = await pdfToImage(buf, { density: 100 });
    for await (const page of doc) pages.push(page);
    return pages;
  }
  return [buf];
}

async function main() {
  console.log(`Loading source: ${SOURCE}`);
  const images = await getImages(SOURCE);
  console.log(`Prepared ${images.length} page image(s). Extracting via ${MODEL}...`);

  const all = [];
  const seen = new Set();
  for (let i = 0; i < images.length; i += PAGES_PER_CALL) {
    const batch = images.slice(i, i + PAGES_PER_CALL);
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

  console.log(`TOTAL unique questions: ${all.length}`);
  if (all.length === 0) {
    console.log("No questions extracted.");
    return;
  }
  if (DRY_RUN) {
    for (const q of all.slice(0, 3)) {
      console.log(`- ${normalize(q.question || "", "\n")}`);
      (q.options || []).forEach((o, i) => console.log(`  ${String.fromCharCode(65 + i)}. ${normalize(o, " / ")}`));
    }
    console.log("DRY_RUN=true -> no file written.");
    return;
  }

  const children = [
    new Paragraph({
      heading: "Title",
      children: [new TextRun({ text: `${TITLE} — Questions`, bold: true })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `Total questions: ${all.length}. Answer key & explanation to be filled.`, italics: true })],
    }),
  ];

  all.forEach((q, idx) => {
    children.push(
      new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: `Q${idx + 1}.`, bold: true })] })
    );
    for (const line of String(q.question || "").split("\n")) {
      if (line.trim()) children.push(new Paragraph({ children: [new TextRun(line)] }));
    }
    const opts = q.options || [];
    opts.forEach((o, oi) => {
      children.push(
        new Paragraph({
          indent: { left: 360 },
          children: [new TextRun({ text: `${String.fromCharCode(65 + oi)}. ${normalize(o, " / ")}`, size: 22 })],
        })
      );
    });
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Answer: ____    Explanation: ________________________", italics: true, color: "888888" })],
      })
    );
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Nirmala UI" } } } },
    sections: [{ children }],
  });
  const outBuf = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT, outBuf);
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
