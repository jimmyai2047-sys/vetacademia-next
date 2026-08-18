import mammoth from "mammoth";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const FILE_PATH = "./scripts/chapter.docx";
const SUBJECT_ID = "cmsqtqg23001gwwk55wd4sqdc";
const CHAPTER_TITLE = "अध्याय 1- राजस्थान में पशुपालन का आर्थिक महत्व";

const INLINE_IMG_RE =
  /<img\b[^>]*\ssrc=["'](data:image\/([a-zA-Z0-9.+-]+);base64,([^"']+))["'][^>]*>/gi;

async function processInlineImages(html: string): Promise<string> {
  if (!html || !/data:image\//.test(html)) return html;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return html;

  const matches = [...html.matchAll(INLINE_IMG_RE)].slice(0, 60);
  let out = html;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const dataUrl = m[1];
    const mime = m[2];
    const b64 = m[3];
    console.log(`  Uploading image ${i + 1}/${matches.length}...`);
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
            buffer = await sharp(buffer).rotate().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
            ext = "webp";
          } else {
            buffer = await sharp(buffer).webp({ quality: 72 }).toBuffer();
            ext = "webp";
          }
        } catch {}
      }

      const path = `chapters/${randomUUID()}.${ext}`;
      const blob = await put(path, buffer, { access: "private", token, addRandomSuffix: false, multipart: true });
      out = out.split(dataUrl).join(blob.url);
    } catch (err) {
      console.error(`  Image ${i + 1} failed:`, err);
    }
  }
  return out;
}

function sanitizeChapterContent(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

async function main() {
  console.log("Reading:", FILE_PATH);
  const buffer = readFileSync(FILE_PATH);

  console.log("Parsing with mammoth...");
  const result = await mammoth.convertToHtml({ buffer }, { convertImage: (mammoth as any).images.dataUri });
  console.log("HTML length:", result.value.length, "chars");

  console.log("Deleting existing chapters for this subject...");
  const deleted = await prisma.chapter.deleteMany({ where: { subjectId: SUBJECT_ID } });
  console.log(`Deleted ${deleted.count} chapters`);

  console.log("Processing images...");
  const optimized = await processInlineImages(result.value);
  console.log(`After image processing: ${Math.round(optimized.length / 1024)} KB`);

  console.log("Saving as single chapter...");
  const chapter = await prisma.chapter.create({
    data: {
      subjectId: SUBJECT_ID,
      title: CHAPTER_TITLE,
      content: sanitizeChapterContent(optimized),
      unitNumber: 1,
      type: null,
    },
  });
  console.log(`Created chapter: ${chapter.id}`);

  console.log("Done!");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
