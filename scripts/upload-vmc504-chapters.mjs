import "dotenv/config";
import mammoth from "mammoth";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import sanitizeHtml from "sanitize-html";

// Uploads the VMC 504 Systematic Veterinary Virology book chapters as ChapterSection
// rows on course chapter VMC 504 (ONE section per book chapter, order 0..19).
//
// Why this does NOT reuse the upload-vmc501-unit2.mjs <h1> splitter:
//   The individual VMC 504 chapter .docx files carry no Heading1 on the chapter title.
//   "CHAPTER 1" / "Poxviridae" / "Lectures 1-2" are plain (unstyled) paragraphs, and the
//   16 Heading1 paragraphs are the in-chapter sections (1.1 Introduction, 1.2
//   Classification, ... 1.13 Multiple Choice Questions). Splitting on <h1> would produce
//   ~299 sections across the book instead of 20. So each file -> exactly one section.
//
// Usage:
//   node scripts/upload-vmc504-chapters.mjs --dry-run    # preview, no DB / no Blob writes
//   node scripts/upload-vmc504-chapters.mjs             # insert (aborts if sections exist)
//   node scripts/upload-vmc504-chapters.mjs --force      # delete existing sections first
//
// The uploaded HTML is stored sanitized + figure-free (base64 -> Vercel Blob -> URL),
// matching what GET /reader/[chapterId]/[index] expects (prepareChapterHtml re-signs
// the private Blob URLs on read).

const SRC_DIR =
  "D:\\Preparation for Competitive Examinations\\Academic Programmes\\M.V.Sc\\Veterinary Microbiology (M.V.Sc)\\VMC 504 (Systematic Veterinary Virology)\\Individual Book Chapter in Word file";
const CHAPTER_ID = "cmsr043670003t8k52qcws78m"; // VMC 504 | Systematic Veterinary Virology

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const INLINE_IMG_RE =
  /<img\b[^>]*\ssrc=["'](data:image\/([a-zA-Z0-9.+-]+);base64,([^"']+))["'][^>]*>/gi;

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

// "CHAPTER 1" + next paragraph ("Poxviridae") -> "Chapter 1: Poxviridae"
function deriveTitle(html, fileName) {
  const m = html.match(
    /<p[^>]*>\s*CHAPTER\s*(\d+)\s*<\/p>\s*<p[^>]*>([\s\S]{1,120}?)<\/p>/i
  );
  if (m) {
    const num = Number(m[1]);
    const family = sanitizeHtml(m[2], { allowedTags: [], allowedAttributes: {} })
      .replace(/\s+/g, " ")
      .trim();
    if (num && family) return `Chapter ${num}: ${family}`;
  }
  // Fallback: VMC504_Chapter05_Papillomaviridae_Polyomaviridae -> Chapter 5: Papillomaviridae Polyomaviridae
  const f = fileName.replace(/\.docx$/i, "").match(/Chapter(\d+)_(.+)/i);
  if (f) {
    return `Chapter ${Number(f[1])}: ${f[2].replace(/_/g, " ")}`;
  }
  return fileName;
}

// The reader already renders <h1>{section.title}</h1> (reader-page.tsx:109) and styles
// .chapter-content h1 as a page title (globals.css:247 -- margin-top:0 + border-bottom).
// The book's own Heading1s (1.1 Introduction, 1.2 Classification, ... Answer Key) are
// IN-chapter subsections, so demote one level: h1->h2, h2->h3, h3->h4. That yields the
// same one-h1-per-page + h2-subsection structure the live VMC 501 sections already use.
// Applied top-down (h3 first) so a freshly-created h3 from the h2 pass is never re-matched.
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

async function main() {
  console.log(`\nVMC 504 chapter import${DRY_RUN ? " [DRY RUN]" : ""}`);
  console.log("source:", SRC_DIR);
  console.log("chapterId:", CHAPTER_ID, FORCE ? "(--force)" : "");

  const files = readdirSync(SRC_DIR)
    .filter((f) => /\.docx$/i.test(f) && !f.startsWith("~$"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (files.length === 0) throw new Error("No .docx files found in SRC_DIR");
  console.log("files:", files.length);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  const chapter = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID }, select: { id: true, title: true, courseCode: true, subjectId: true } });
  if (!chapter) throw new Error(`Chapter ${CHAPTER_ID} not found`);
  if (chapter.courseCode !== "VMC 504") throw new Error(`courseCode mismatch: ${chapter.courseCode}`);

  const existing = await prisma.chapterSection.count({ where: { chapterId: CHAPTER_ID } });
  if (existing > 0 && !FORCE && !DRY_RUN) {
    console.error(`\nABORT: ${existing} ChapterSection rows already exist for VMC 504.`);
    console.error("       Re-run with --force to delete and rebuild them.");
    await prisma.$disconnect();
    process.exit(1);
  }

  const rows = [];
  let totalUploaded = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buffer = readFileSync(join(SRC_DIR, file));
    const { value: html } = await mammoth.convertToHtml({ buffer }, { convertImage: mammoth.images.dataUri });

    const title = deriveTitle(html, file);
    const sanitized = sanitize(demoteHeadings(html));
    const { html: withBlobs, uploaded, pending } = await processInlineImages(sanitized, { upload: !DRY_RUN });
    const finalHtml = sanitize(withBlobs);
    totalUploaded += uploaded;

    rows.push({ order: i, title, content: finalHtml, source: file, images: uploaded || pending || 0 });

    const txt = plainText(finalHtml);
    const lectures = (txt.match(/Lectures\s*[\d\s\-–—]+/i) || [""])[0].trim();
    console.log(
      `  [${String(i).padStart(2, "0")}] ${title.padEnd(46)} ` +
        `chars=${String(finalHtml.length).padStart(6)} ` +
        `h1=${countTag(finalHtml, "h1")} h2=${countTag(finalHtml, "h2")} ` +
        `tbl=${countTag(finalHtml, "table")} ` +
        `img=${DRY_RUN ? (pending ?? 0) : uploaded}` +
        (lectures ? `  ${lectures}` : "")
    );
  }

  // Sanity: book must be 20 chapters.
  if (rows.length !== 20) {
    console.error(`\nABORT: expected 20 chapter files, found ${rows.length}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  const empty = rows.filter((r) => r.content.length < 500);
  if (empty.length) {
    console.error("\nABORT: suspiciously short sections:", empty.map((r) => r.title));
    await prisma.$disconnect();
    process.exit(1);
  }

  if (DRY_RUN) {
    const pending = rows.reduce((s, r) => s + r.images, 0);
    console.log(`\nDRY RUN complete — nothing written. ${rows.length} sections would be inserted.`);
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
