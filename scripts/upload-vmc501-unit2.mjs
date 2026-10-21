import "dotenv/config";
import mammoth from "mammoth";
import { readFileSync } from "fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import sanitizeHtml from "sanitize-html";

const FILE_PATH = "D:\\Preparation for Competitive Examinations\\Academic Programmes\\M.V.Sc\\Veterinary Microbiology (M.V.Sc)\\VMC501_Unit2_Bacterial_Genetics.docx";
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

async function processInlineImages(html) {
  if (!html || !/data:image\//.test(html)) return html;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) { console.log("  (no blob token, keeping base64)"); return html; }
  const matches = [...html.matchAll(INLINE_IMG_RE)].slice(0, 60);
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

async function main() {
  console.log("Reading:", FILE_PATH);
  const buffer = readFileSync(FILE_PATH);
  const result = await mammoth.convertToHtml({ buffer }, { convertImage: mammoth.images.dataUri });
  const html = result.value;
  console.log("HTML chars:", html.length);

  const h1Matches = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)];
  console.log("H1s:", h1Matches.map(m => m[1].replace(/<[^>]+>/g, "").slice(0, 80)));

  const splitRe = /(<h1[^>]*>.*?<\/h1>)/gi;
  const tokens = html.split(splitRe);
  const preamble = tokens[0] || "";
  const chapters = [];
  for (let i = 1; i < tokens.length; i += 2) {
    const h1html = tokens[i];
    const body = tokens[i + 1] || "";
    const title = h1html.replace(/<[^>]+>/g, "").trim();
    chapters.push({ title, body: h1html + body });
  }
  console.log(`Chapters: ${chapters.length}, preamble len=${preamble.length}`);
  chapters.forEach((s, i) => console.log(` ${i}: ${s.title.slice(0,80)} len=${s.body.length} imgs=${(s.body.match(/<img/gi) || []).length} tables=${(s.body.match(/<table/gi) || []).length}`));

  if (DRY_RUN) { console.log("DRY RUN - no DB writes"); return; }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const ch = await prisma.chapter.findUnique({
    where: { id: CHAPTER_ID },
    include: { sections: { orderBy: { order: "asc" }, select: { order: true } } },
  });
  if (!ch) { console.error("Chapter not found"); await prisma.$disconnect(); return; }
  const nextOrder = ch.sections.length ? Math.max(...ch.sections.map(s => s.order)) + 1 : 0;
  console.log(`Existing sections: ${ch.sections.length}, next order: ${nextOrder}`);

  const newTitles = [];
  for (let i = 0; i < chapters.length; i++) {
    const c = chapters[i];
    const title = `Unit II: ${c.title}`;
    newTitles.push(title);
    console.log(`Processing [${nextOrder + i}] ${title.slice(0, 80)}...`);
    const withBlobs = await processInlineImages(c.body);
    const clean = sanitize(withBlobs);
    console.log(`  sanitized len=${clean.length} (was ${c.body.length})`);
    await prisma.chapterSection.create({ data: { chapterId: CHAPTER_ID, title, content: clean, order: nextOrder + i } });
    console.log("  created");
  }

  // Update overview: replace the "Units II and III follow" line with Unit II lecture list
  const unit2List = `<h2>Unit II — Lectures (Bacterial Genetics)</h2><ol>` + newTitles.map(t => `<li>${t}</li>`).join("") + `</ol>`;
  let overview = ch.content;
  const oldTail = "Units II and III with the practical manual follow as companion sections.";
  if (overview.includes(oldTail)) {
    overview = overview.replace(oldTail, "Unit III with the practical manual follows as the next companion section.");
  }
  overview += unit2List + `<p>Open each lecture in the Reader for full text, tables and figures.</p>`;
  const cleanOverview = sanitize(overview);
  await prisma.chapter.update({
    where: { id: CHAPTER_ID },
    data: {
      content: cleanOverview,
      description: "VMC 501 Units I & II: Foundations of Bacteriology and Bacterial Genetics — History, Taxonomy, Microscopy, Cell Structure, Growth, Diagnosis, Genome, Gene Transfer, Plasmids and Drug Resistance (12 lectures with figures and tables).",
      tags: ["VMC501", "General Bacteriology", "Unit I", "Unit II", "Bacterial Genetics", "M.V.Sc", "Veterinary Microbiology"],
    },
  });
  console.log("Updated chapter overview + description");

  const verify = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID }, include: { sections: { orderBy: { order: "asc" }, select: { title: true, order: true } } } });
  console.log("VERIFY total sections:", verify.sections.length);
  verify.sections.forEach(s => console.log(` [${s.order}] ${s.title.slice(0, 70)}`));
  console.log("VERIFY overview len:", verify.content.length);
  await prisma.$disconnect();
  console.log("Done!");
}
main().catch(e => { console.error(e); process.exit(1); });
