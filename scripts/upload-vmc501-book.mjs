import "dotenv/config";
import mammoth from "mammoth";
import { readFileSync } from "fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import sanitizeHtml from "sanitize-html";

const FILE_PATH = "D:\\Preparation for Competitive Examinations\\Academic Programmes\\M.V.Sc\\Veterinary Microbiology (M.V.Sc)\\VMC 501 (General Bacteriology)\\VMC501_General_Bacteriology_Book_Authenticity_Checked_Revised.docx";
const CHAPTER_ID = "cmsr042fe0000t8k5pnn4twox"; // VMC 501 General Bacteriology*
const DRY_RUN = process.argv.includes("--dry-run");

const INLINE_IMG_RE = /<img\b[^>]*\ssrc=["'](data:image\/([a-zA-Z0-9.+-]+);base64,([^"']+))["'][^>]*>/gi;

function sanitize(html) {
  return sanitizeHtml(html, {
    allowedTags: ["p","br","strong","b","em","i","u","s","h1","h2","h3","h4","ul","ol","li","a","img","blockquote","code","pre","span","table","thead","tbody","tfoot","tr","td","th","caption"],
    allowedAttributes: { a: ["href","target","rel"], img: ["src","alt","loading","decoding"], td: ["colspan","rowspan"], th: ["colspan","rowspan"], "*": ["class","style"] },
    transformTags: { img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy", decoding: "async" } }) },
    allowedSchemes: ["http","https","data"],
    allowedSchemesByTag: { img: ["http","https","data"] },
  });
}

async function processInlineImages(html, label) {
  if (!html || !/data:image\//.test(html)) return html;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) { console.log("  (no blob token, keeping base64)"); return html; }
  const matches = [...html.matchAll(INLINE_IMG_RE)].slice(0, 80);
  console.log(`  Uploading ${matches.length} images...`);
  let out = html;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const dataUrl = m[1]; const mime = m[2]; const b64 = m[3];
    try {
      let buffer = Buffer.from(b64, "base64");
      let ext = (mime.split("/")[1] || "png").replace("+xml", "");
      if (ext === "jpeg") ext = "jpg";
      if (ext !== "svg") {
        try {
          const sharp = (await import("sharp")).default;
          const meta = await sharp(buffer).metadata();
          const isLarge = buffer.length > 50*1024 || (meta.width && meta.width > 1200);
          if (isLarge) buffer = await sharp(buffer).rotate().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
          else buffer = await sharp(buffer).webp({ quality: 72 }).toBuffer();
          ext = "webp";
        } catch {}
      }
      const path = `chapters/${randomUUID()}.${ext}`;
      const blob = await put(path, buffer, { access: "private", token, addRandomSuffix: false, multipart: true });
      console.log(`   img ${i+1}: ${Math.round(b64.length/1024)}KB b64 -> uploaded`);
      out = out.split(dataUrl).join(blob.url);
    } catch (e) { console.error(`   img ${i+1} failed`, e); }
  }
  return out;
}

function unitOf(n) { return n <= 9 ? "I" : n <= 12 ? "II" : "III"; }

async function main() {
  console.log("Reading (45MB, may take a minute)...");
  const buffer = readFileSync(FILE_PATH);
  const result = await mammoth.convertToHtml({ buffer }, { convertImage: mammoth.images.dataUri });
  const html = result.value;
  console.log("HTML chars:", html.length, "images:", (html.match(/<img/gi) || []).length, "tables:", (html.match(/<table/gi) || []).length);

  // Split on standalone CHAPTER N markers: <p>(<strong>?)CHAPTER (\d+)(</strong>?)</p>
  const markerRe = /<p>(?:<strong>)?CHAPTER (\d+)(?:<\/strong>)?<\/p>/gi;
  const markers = [...html.matchAll(markerRe)];
  console.log("CHAPTER markers:", markers.map(m => m[1]).join(","));
  if (markers.length !== 16) console.log("WARNING: expected 16 chapter markers!");

  const chapters = [];
  for (let i = 0; i < markers.length; i++) {
    const num = parseInt(markers[i][1], 10);
    const start = markers[i].index + markers[i][0].length;
    let end = markers[i + 1] ? markers[i + 1].index : html.length;
    // Last chapter ends before Index/About-the-Author back matter
    if (i === markers.length - 1) {
      const backMatter = html.slice(start).search(/<h1[^>]*>(Index|About the Author)/i);
      if (backMatter > 0) end = start + backMatter;
    }
    let body = html.slice(start, end);
    // Title = first non-empty paragraph after marker
    const titleMatch = body.match(/<p>(.*?)<\/p>/is);
    let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : `Chapter ${num}`;
    // Drop running headers/footers that leaked into body text
    body = body.replace(/<p>VMC 501: General Bacteriology<\/p>/gi, "")
               .replace(/<p>Chapter \d+ \| Page \d+<\/p>/gi, "");
    // Drop trailing UNIT divider page text belonging to the next unit
    body = body.replace(/(<p>UNIT [IVX]+.*?<\/p>[\s\S]*)$/i, (m) => (/CHAPTER/i.test(m) || m.length > 2000) ? m : "");
    const imgs = (body.match(/<img/gi) || []).length;
    const tabs = (body.match(/<table/gi) || []).length;
    chapters.push({ num, title, body, imgs, tabs });
    console.log(` Ch${num} [Unit ${unitOf(num)}]: ${title.slice(0, 70)} | html=${body.length} imgs=${imgs} tables=${tabs}`);
  }

  if (DRY_RUN) { console.log("DRY RUN - no DB writes"); return; }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const ch = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID }, select: { id: true, title: true } });
  if (!ch) { console.error("Chapter not found"); await prisma.$disconnect(); return; }

  const del = await prisma.chapterSection.deleteMany({ where: { chapterId: CHAPTER_ID } });
  console.log(`Deleted ${del.count} old sections (Units I+II drafts replaced by revised book)`);

  const unitNames = { I: "Foundations of Bacteriology", II: "Bacterial Genetics", III: "Pathogenicity, Bacteriophages, Antimicrobials and Immunity" };
  for (let i = 0; i < chapters.length; i++) {
    const c = chapters[i];
    const sectionTitle = `Chapter ${c.num}: ${c.title}`;
    console.log(`Processing [${i}] ${sectionTitle.slice(0, 75)}...`);
    const h1 = `<h1>Chapter ${c.num}: ${c.title}</h1>`;
    const withBlobs = await processInlineImages(c.body, sectionTitle);
    const clean = sanitize(h1 + withBlobs);
    console.log(`  sanitized len=${clean.length}`);
    await prisma.chapterSection.create({ data: { chapterId: CHAPTER_ID, title: sectionTitle, content: clean, order: i } });
    console.log("  created");
  }

  const li = (arr) => arr.map(t => `<li>${t}</li>`).join("");
  const u1 = chapters.filter(c => unitOf(c.num) === "I").map(c => `Chapter ${c.num}: ${c.title}`);
  const u2 = chapters.filter(c => unitOf(c.num) === "II").map(c => `Chapter ${c.num}: ${c.title}`);
  const u3 = chapters.filter(c => unitOf(c.num) === "III").map(c => `Chapter ${c.num}: ${c.title}`);
  const overview = `<h1>About This Course</h1><p><strong>VMC 501: General Bacteriology</strong> — A Textbook for M.V.Sc. Students of Veterinary Microbiology. Credit hours 2+1: 32 theory lectures in 16 chapters across 3 units, by Dr. Ashok Baindha, PGIVER Jaipur (RUVAS, Jaipur).</p>` +
    `<h2>Unit I — Foundations of Bacteriology (Chapters 1–9)</h2><ol>${li(u1)}</ol>` +
    `<h2>Unit II — Bacterial Genetics (Chapters 10–12)</h2><ol>${li(u2)}</ol>` +
    `<h2>Unit III — Pathogenicity, Bacteriophages, Antimicrobials and Immunity (Chapters 13–16)</h2><ol>${li(u3)}</ol>` +
    `<p>Open each lecture in the Reader for full text, tables and figures. Each chapter has learning objectives, summary, glossary, 20 MCQs with answer key, and short/long questions.</p>`;
  await prisma.chapter.update({
    where: { id: CHAPTER_ID },
    data: {
      content: sanitize(overview),
      description: "VMC 501 complete book: General Bacteriology — all 16 chapters, Units I–III (history, taxonomy, microscopy, cell structure, growth, diagnosis, genetics, gene transfer, resistance, pathogenicity, phages, antimicrobials, immunity) with figures, tables and MCQs.",
      tags: ["VMC501", "General Bacteriology", "Complete Book", "Unit I", "Unit II", "Unit III", "M.V.Sc", "Veterinary Microbiology"],
    },
  });
  console.log("Overview + description updated");

  const verify = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID }, include: { sections: { orderBy: { order: "asc" }, select: { title: true, order: true } } } });
  console.log("VERIFY sections:", verify.sections.length);
  await prisma.$disconnect();
  console.log("Done!");
}
main().catch(e => { console.error(e); process.exit(1); });
