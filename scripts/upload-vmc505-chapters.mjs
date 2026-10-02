import "dotenv/config";
import mammoth from "mammoth";
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import sanitizeHtml from "sanitize-html";

// Uploads the VMC 505 Principles of Veterinary Immunology book chapters as ChapterSection rows
// on course chapter VMC 505 (ONE section per book chapter, order 0..22 -> 23).
//
// SOURCE = the Complete Book .docx (the docx twin of the PDF named by the user;
// this model cannot read PDFs). 23 chapters, 45 figures inside the chapter
// segments (48 embedded book-wide), no suggestion boxes, no editorial notes.
// A unit preamble paragraph "<p>Unit I-V — ...</p>" precedes every opener and is
// trimmed from the previous segment.
//
// The book is split at its "<p><strong>CHAPTER N</strong></p>" openers, the
// in-chapter "<h?>N.M Multiple Choice Questions" ... "<h?>N.(M+1) Short Answer
// Questions" block (incl. <h3>Answer Key</h3>) is REMOVED at build time (same
// user decision as VMC 502/503/504/506: the end-of-chapter mock test is the
// single home for MCQs). import-vmc505-tests.mjs reads those MCQs from the same book.
//
// Usage:
//   node scripts/upload-vmc505-chapters.mjs --dry-run    # preview, no DB/Blob writes
//   node scripts/upload-vmc505-chapters.mjs              # insert (aborts if sections exist)
//   node scripts/upload-vmc505-chapters.mjs --force      # delete existing sections first

const SRC =
  "D:\\Preparation for Competitive Examinations\\Academic Programmes\\M.V.Sc\\Veterinary Microbiology (M.V.Sc)\\VMC 505 (Principles of Veterinary Immunology)\\VMC505_Principles_of_Veterinary_Immunology_Complete_Book.docx";
const CHAPTER_ID = "cmsr043fh0004t8k57pn977sn"; // VMC 505 | Principles of Veterinary Immunology
const EXPECTED_CHAPTERS = 23;

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const INLINE_IMG_RE =
  /<img\b[^>]*\ssrc=["'](data:image\/([a-zA-Z0-9.+-]+);base64,([^"']+))["'][^>]*>/gi;

const MCQ_RE = /<h([1-4])[^>]*>\s*\d+\.\d+\s+Multiple Choice Questions\s*<\/h\1\s*>/i;
const SHORT_RE = /<h([1-4])[^>]*>\s*\d+\.\d+\s+Short Answer Questions\s*<\/h\1\s*>/i;
const KEY_RE = /<h([1-4])[^>]*>\s*Answer Key\s*<\/h\1\s*>/i;
const OPENER_RE = /CHAPTER\s*(\d{1,2})/g;
const UNIT_TAIL_RE = /<p>\s*Unit\s+[IVX]+[^<]*<\/p>\s*$/i;

// Same allow-list as src/lib/content.ts (sanitizeChapterContent).
function sanitize(html) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "h1", "h2", "h3", "h4",
      "ul", "ol", "li", "a", "img", "blockquote", "code", "pre", "span",
      "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "loading", "decoding"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      "*": ["class", "style"],
    },
    transformTags: {
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy", decoding: "async" },
      }),
    },
    allowedSchemes: ["http", "https", "data"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
  });
}

async function processInlineImages(html, { upload }) {
  if (!html || !/data:image\//.test(html)) return { html, uploaded: 0 };
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!upload || !token) {
    const n = [...html.matchAll(INLINE_IMG_RE)].length;
    return { html, uploaded: 0, pending: n };
  }
  const matches = [...html.matchAll(INLINE_IMG_RE)].slice(0, 60);
  let out = html;
  let uploaded = 0;
  for (const m of matches) {
    const dataUrl = m[1];
    const mime = m[2];
    const b64 = m[3];
    try {
      let buffer = Buffer.from(b64, "base64");
      let ext = (mime.split("/")[1] || "png").replace("+xml", "");
      if (ext === "jpeg") ext = "jpg";
      if (ext !== "svg") {
        try {
          const sharp = (await import("sharp")).default;
          const meta = await sharp(buffer).metadata();
          const isLarge = buffer.length > 50 * 1024 || (meta.width && meta.width > 1200);
          if (isLarge) {
            buffer = await sharp(buffer)
              .rotate()
              .resize({ width: 1200, withoutEnlargement: true })
              .webp({ quality: 72 })
              .toBuffer();
          } else {
            buffer = await sharp(buffer).webp({ quality: 72 }).toBuffer();
          }
          ext = "webp";
        } catch {
          /* keep original bytes */
        }
      }
      const blob = await put(`chapters/${randomUUID()}.${ext}`, buffer, {
        access: "private",
        token,
        addRandomSuffix: false,
        multipart: true,
      });
      out = out.split(dataUrl).join(blob.url);
      uploaded++;
    } catch (e) {
      console.error("   image upload failed:", e.message);
    }
  }
  return { html: out, uploaded };
}

// "<p><strong>CHAPTER 4</strong></p><p><strong>Classification of Fungi…</strong></p>"
// -> { num: 4, title: "Chapter 4: Classification of Fungi…" }
function deriveTitle(html) {
  const strip = (h) =>
    sanitizeHtml(h, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
  const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].slice(0, 12).map((m) => m[1]);
  for (let i = 0; i < paras.length; i++) {
    const num = strip(paras[i]).match(/^CHAPTER\s*(\d+)$/i);
    if (num && paras[i + 1]) {
      const topic = strip(paras[i + 1]);
      if (topic) return { num: Number(num[1]), title: `Chapter ${Number(num[1])}: ${topic}`, family: topic };
    }
  }
  throw new Error(`Cannot derive chapter title from segment starting: ${strip(html.slice(0, 200))}`);
}

// Cut the in-chapter MCQ + Answer Key block (MCQ heading -> Short Answer
// heading). All 23 chapters carry Summary/Glossary/Short/Long/Suggested
// Readings, so all of them must survive the cut.
function stripMcqBlock(html, tag) {
  const mcqHits = [...html.matchAll(new RegExp(MCQ_RE, "gi"))];
  const shortHits = [...html.matchAll(new RegExp(SHORT_RE, "gi"))];
  if (mcqHits.length !== 1 || shortHits.length !== 1) {
    throw new Error(`${tag}: mcq headings=${mcqHits.length}, short headings=${shortHits.length} (need 1 each)`);
  }
  const start = mcqHits[0].index;
  const ends = shortHits.map((h) => h.index).filter((i) => i > start);
  if (ends.length !== 1) throw new Error(`${tag}: short heading not uniquely after MCQ block`);
  const end = ends[0];
  const span = html.slice(start, end);
  const keyHits = [...span.matchAll(new RegExp(KEY_RE, "gi"))];
  if (keyHits.length !== 1) throw new Error(`${tag}: answer-key headings in span=${keyHits.length}`);
  if (span.length < 1500 || span.length > 20000) throw new Error(`${tag}: MCQ span length ${span.length} implausible`);
  const rest = html.slice(0, start) + html.slice(end);
  const mustRemain = ["Short Answer Questions", "Long Answer Questions", "Summary", "Glossary", "Suggested Readings"];
  const lost = mustRemain.filter((b) => !rest.includes(b));
  if (lost.length) throw new Error(`${tag}: lost sections after MCQ cut: ${lost.join(", ")}`);
  const left = ["Multiple Choice Questions", "Answer Key"].filter((b) => rest.includes(b));
  if (left.length) throw new Error(`${tag}: still contains ${left.join(", ")} after cut`);
  return { html: rest, cut: span.length };
}

// The reader already renders <h1>{section.title}</h1>; the book's own Heading1s
// are in-chapter subsections, so demote one level (h3 first, so a fresh h3 from
// the h2 pass is never re-matched).
function demoteHeadings(html) {
  return html
    .replace(/<\/?h3\b/gi, (m) => m.replace("h3", "h4"))
    .replace(/<\/?h2\b/gi, (m) => m.replace("h2", "h3"))
    .replace(/<\/?h1\b/gi, (m) => m.replace("h1", "h2"));
}

function countTag(html, tag) {
  return (html.match(new RegExp(`<${tag}[\\s>]`, "gi")) || []).length;
}

function plainText(html) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

const ARTIFACTS = ["HYPERLINK", "mso-", "MERGEFORMAT", "PAGEREF", "\\o(", "data:image/"];

// Split the book at its CHAPTER openers. Segment N runs from the "<p>" that
// opens "<p><strong>CHAPTER N</strong></p>" up to the next chapter's opener
// paragraph; the trailing "<p>Unit I/II — …</p>" preamble that belongs to the
// NEXT chapter is trimmed off. The last chapter ends at the back-matter
// "<h1>Index</h1>".
function splitChapters(book) {
  const openers = [...book.matchAll(OPENER_RE)].map((m) => ({
    n: Number(m[1]),
    idx: m.index,
    pStart: book.lastIndexOf("<p", m.index),
  }));
  const nums = openers.map((o) => o.n);
  const expected = Array.from({ length: EXPECTED_CHAPTERS }, (_, i) => i + 1);
  if (JSON.stringify(nums) !== JSON.stringify(expected)) {
    throw new Error(`chapter openers out of sequence: ${JSON.stringify(nums)}`);
  }
  const indexHeading = book.indexOf("<h1>Index</h1>", openers[openers.length - 1].idx);
  if (indexHeading < 0) throw new Error("back-matter <h1>Index</h1> not found after chapter 23");
  return openers.map((o, i) => {
    const end = i + 1 < openers.length ? book.lastIndexOf("<p", openers[i + 1].idx) : indexHeading;
    if (end <= o.pStart) throw new Error(`chapter ${o.n}: empty segment (end=${end}, start=${o.pStart})`);
    return { num: o.n, raw: book.slice(o.pStart, end) };
  });
}

async function main() {
  console.log(`\nVMC 505 chapter import${DRY_RUN ? " [DRY RUN]" : ""}`);
  console.log("source:", SRC);
  console.log("chapterId:", CHAPTER_ID, FORCE ? "(--force)" : "");

  const buffer = readFileSync(SRC);
  const { value: book } = await mammoth.convertToHtml({ buffer }, { convertImage: mammoth.images.dataUri });
  const segments = splitChapters(book);
  console.log("chapters:", segments.length);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  const chapter = await prisma.chapter.findUnique({
    where: { id: CHAPTER_ID },
    select: { id: true, title: true, courseCode: true, subjectId: true },
  });
  if (!chapter) throw new Error(`Chapter ${CHAPTER_ID} not found`);
  if (chapter.courseCode !== "VMC 505") throw new Error(`courseCode mismatch: ${chapter.courseCode}`);

  const existing = await prisma.chapterSection.count({ where: { chapterId: CHAPTER_ID } });
  if (existing > 0 && !FORCE && !DRY_RUN) {
    console.error(`\nABORT: ${existing} ChapterSection rows already exist for VMC 505.`);
    console.error("       Re-run with --force to delete and rebuild them.");
    await prisma.$disconnect();
    process.exit(1);
  }

  const rows = [];
  let totalUploaded = 0;
  let totalCut = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const trimmed = seg.raw.replace(UNIT_TAIL_RE, "");
    const { num, title } = deriveTitle(trimmed);
    if (num !== i + 1) throw new Error(`segment ${i + 1}: chapter number ${num} != position ${i + 1}`);

    const { html: stripped, cut } = stripMcqBlock(trimmed, title);
    totalCut += cut;
    if (/<h[5-6][\s>]/i.test(stripped)) throw new Error(`${title}: source uses <h5>/<h6> (not in the reader allow-list)`);

    const sanitized = sanitize(demoteHeadings(stripped));
    const { html: withBlobs, uploaded, pending } = await processInlineImages(sanitized, { upload: !DRY_RUN });
    const finalHtml = sanitize(withBlobs);
    totalUploaded += uploaded;

    const h1 = countTag(finalHtml, "h1");
    if (h1 !== 0) throw new Error(`${title}: ${h1} <h1> left after demote (reader renders the title as h1)`);

    const art = ARTIFACTS.filter((a) => (a === "data:image/" ? !DRY_RUN : true) && finalHtml.includes(a));
    if (art.length && !DRY_RUN) throw new Error(`${title}: conversion artifacts left after upload: ${art.join(", ")}`);
    if (art.length) console.error(`   WARN ${title}: artifacts ${art.join(", ")}`);

    const trailingUnit = UNIT_TAIL_RE.test(stripped);
    if (trailingUnit) throw new Error(`${title}: trailing unit preamble still present`);

    rows.push({ order: i, title, content: finalHtml, source: `book ch${num}`, images: uploaded || pending || 0 });

    const txt = plainText(finalHtml);
    const lectures = (txt.match(/Lectures?\s*[\d\s\-–—,]+/i) || [""])[0].trim();
    console.log(
      `  [${String(i).padStart(2, "0")}] ${title.padEnd(72)} ` +
        `chars=${String(finalHtml.length).padStart(7)} ` +
        `h2=${countTag(finalHtml, "h2")} h3=${countTag(finalHtml, "h3")} h4=${countTag(finalHtml, "h4")} ` +
        `tbl=${countTag(finalHtml, "table")} img=${DRY_RUN ? (pending ?? 0) : uploaded} ` +
        `cut=${cut}` +
        (lectures ? `  ${lectures}` : "")
    );
  }

  const empty = rows.filter((r) => r.content.length < 500);
  if (empty.length) throw new Error(`suspiciously short sections: ${empty.map((r) => r.title).join(", ")}`);

  if (DRY_RUN) {
    const pending = rows.reduce((s, r) => s + r.images, 0);
    console.log(`\nDRY RUN complete — nothing written. ${rows.length} sections would be inserted.`);
    console.log(`In-chapter MCQ blocks removed: ${totalCut} chars total.`);
    console.log(`Base64 figures pending Vercel Blob upload: ${pending}`);
    await prisma.$disconnect();
    return;
  }

  const inserted = await prisma.$transaction(async (tx) => {
    if (existing > 0) {
      const del = await tx.chapterSection.deleteMany({ where: { chapterId: CHAPTER_ID } });
      console.log(`\ndeleted ${del.count} existing section(s)`);
    }
    const created = await tx.chapterSection.createMany({
      data: rows.map((r) => ({ chapterId: CHAPTER_ID, title: r.title, content: r.content, order: r.order })),
    });
    return created.count;
  });

  console.log(`\nInserted ${inserted} ChapterSection rows (order 0..${rows.length - 1}).`);
  console.log(`Uploaded ${totalUploaded} figure(s) to Vercel Blob (private).`);
  console.log(`Course page: /syllabus/mvsc/cmsqtshkn00bcwwk5cqcqk5d0/${CHAPTER_ID}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("\nFAILED:", e);
  process.exit(1);
});
