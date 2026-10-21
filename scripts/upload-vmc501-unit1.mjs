import "dotenv/config";
import mammoth from "mammoth";
import { readFileSync } from "fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import sanitizeHtml from "sanitize-html";

const FILE_PATH = "D:\\Preparation for Competitive Examinations\\Academic Programmes\\M.V.Sc\\Veterinary Microbiology (M.V.Sc)\\VMC501_General_Bacteriology_UnitI1.docx";
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
      console.log(`   img ${i+1}: ${Math.round(b64.length/1024)}KB b64 -> ${blob.url.slice(0,80)}...`);
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

  // Extract h1 titles
  const h1Matches = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)];
  console.log("H1s:", h1Matches.map(m=>m[1].replace(/<[^>]+>/g,"").slice(0,80)));

  // Split keeping h1
  const splitRe = /(<h1[^>]*>.*?<\/h1>)/gi;
  const tokens = html.split(splitRe);
  // tokens[0]=preamble, then [h1, content, h1, content...]
  const sections = [];
  for (let i = 1; i < tokens.length; i += 2) {
    const h1html = tokens[i];
    const body = tokens[i+1] || "";
    const title = h1html.replace(/<[^>]+>/g,"").trim();
    sections.push({ title, body: h1html + body });
  }
  console.log(`Total sections from H1: ${sections.length}`);

  // Keep only Chapter 1..9
  const chapterSections = sections.filter(s => /^Chapter \d+:/.test(s.title));
  console.log(`Chapter sections (1-9): ${chapterSections.length}`);
  chapterSections.forEach((s,i)=> console.log(` ${i}: ${s.title} len=${s.body.length} imgs=${(s.body.match(/<img/gi)||[]).length} tables=${(s.body.match(/<table/gi)||[]).length}`));

  // Overview = About This Course + UNIT I blocks
  const aboutSec = sections.find(s => s.title === "About This Course");
  const unitSec = sections.find(s => s.title === "UNIT I");
  let overview = "";
  if (aboutSec) overview += aboutSec.body;
  if (unitSec) overview += unitSec.body;
  overview += `<h2>Unit I — Lectures</h2><ol>` + chapterSections.map(s=>`<li>${s.title}</li>`).join("") + `</ol><p>Open each lecture in the Reader for full text, tables and figures. Units II and III with the practical manual follow as companion sections.</p>`;
  console.log("Overview len:", overview.length);

  if (DRY_RUN) { console.log("DRY RUN - no DB writes"); return; }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const ch = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID } });
  if (!ch) { console.error("Chapter not found:", CHAPTER_ID); await prisma.$disconnect(); return; }
  console.log("Target chapter:", ch.courseCode, ch.title);

  // Process overview images (likely none) + sanitize
  const overviewProcessed = sanitize(await processInlineImages(overview));

  // Delete existing sections
  const del = await prisma.chapterSection.deleteMany({ where: { chapterId: CHAPTER_ID } });
  console.log(`Deleted ${del.count} existing sections`);

  // Create 9 sections
  for (let i = 0; i < chapterSections.length; i++) {
    const s = chapterSections[i];
    console.log(`Processing [${i+1}/9] ${s.title}...`);
    const withBlobs = await processInlineImages(s.body);
    const clean = sanitize(withBlobs);
    console.log(`  sanitized len=${clean.length} (was ${s.body.length})`);
    await prisma.chapterSection.create({ data: { chapterId: CHAPTER_ID, title: s.title, content: clean, order: i } });
    console.log(`  created section ${i}`);
  }

  await prisma.chapter.update({
    where: { id: CHAPTER_ID },
    data: {
      content: overviewProcessed,
      author: "Dr. Ashok Baindha",
      reviewer: "PGIVER, Jaipur (RUVAS, Bikaner)",
      description: "VMC 501 Unit I: Foundations of Bacteriology — History, Taxonomy, Microscopy, Bacterial Structure, Growth and Diagnosis (9 lectures with figures and tables).",
      tags: ["VMC501","General Bacteriology","Unit I","M.V.Sc","Veterinary Microbiology"],
    },
  });
  console.log("Updated chapter overview content");

  const verify = await prisma.chapter.findUnique({ where: { id: CHAPTER_ID }, include: { sections: { orderBy: { order: "asc" }, select: { id:true, title:true, order:true } } } });
  console.log("VERIFY sections:", verify.sections.map(s=>`${s.order}: ${s.title}`));
  console.log("VERIFY content len:", verify.content.length);
  await prisma.$disconnect();
  console.log("Done!");
}
main().catch(e=>{console.error(e);process.exit(1);});
