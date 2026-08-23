import "dotenv/config";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

const SOURCE_DIR =
  "D:\\Preparation for Competitive Examinations\\Examination\\LSA\\New folder";
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const TRACK = "livestock-assistant";
const EXAM = "psc";

if (!TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN missing from environment");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing from environment");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function parseTitle(fileName) {
  const base = fileName.replace(/\.pdf$/i, "").trim();
  // Extract date like (DD-MM-YYYY)
  const m = base.match(/\((\d{2})-(\d{2})-(\d{4})\)/);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  let title = base;
  if (m) {
    const day = parseInt(m[1], 10);
    const month = months[parseInt(m[2], 10) - 1];
    const year = m[3];
    title = `LSA Previous Year Paper ${year} (${day} ${month} ${year})`;
  } else {
    const ym = base.match(/(\d{4})/);
    const year = ym ? ym[1] : "";
    title = `LSA Previous Year Paper ${year}`.trim();
  }
  return title;
}

async function existingFileNames() {
  const posts = await prisma.post.findMany({
    where: { category: "PREVIOUS_YEAR", track: TRACK },
    select: { fileName: true },
  });
  return new Set(posts.map((p) => p.fileName));
}

async function main() {
  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort();

  if (files.length === 0) {
    console.log("No PDF files found in source folder.");
    return;
  }

  const seen = await existingFileNames();
  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const fullPath = path.join(SOURCE_DIR, file);
    const size = fs.statSync(fullPath).size;
    const safeName = file.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blobPath = `uploads/${Date.now()}-${safeName}`;

    if (seen.has(file)) {
      console.log(`SKIP (already uploaded): ${file}`);
      skipped++;
      continue;
    }

    try {
      const buffer = fs.readFileSync(fullPath);
      const blob = await put(blobPath, buffer, {
        access: "private",
        token: TOKEN,
        addRandomSuffix: false,
        multipart: true,
        contentType: "application/pdf",
      });

      const title = parseTitle(file);
      const post = await prisma.post.create({
        data: {
          title,
          category: "PREVIOUS_YEAR",
          content: `Livestock Assistant (LSA) previous year question paper — ${file}.`,
          exam: EXAM,
          track: TRACK,
          published: true,
          fileUrl: blob.url,
          fileName: file,
          fileType: "PDF",
          fileSize: size,
        },
      });
      console.log(`CREATED [${post.id}] ${title} -> ${blob.url}`);
      created++;
    } catch (err) {
      console.error(`FAILED: ${file}`, err?.message || err);
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
