// Upload the AHDP Previous Year Paper (PYQ) PDFs straight to R2 and register
// them as StudyMaterial rows (type = "PYQ") on their subject, so the subject
// page can render the "Previous Year Papers" tab.
//
// Standing rules honoured here:
//   Rule 1 — bytes never touch the Next.js server: local machine → R2
//            directly (S3 API), and the site reads the public CDN URL.
//   Rule 2 — objects are written with
//            `Cache-Control: public, max-age=31536000, immutable` (the key
//            contains a content hash, so it never changes for the same file).
//
// Usage (run from the repo root, .env holds DATABASE_URL + R2 creds):
//   node scripts/upload-ahdp-pyq.mjs --dry-run   # preview only, no writes
//   node scripts/upload-ahdp-pyq.mjs             # upload + insert/update rows
//
// Idempotent: a row whose url already matches the content-addressed key is
// skipped, so re-running is safe.

import "dotenv/config";
import { createHash } from "crypto";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DRY_RUN = process.argv.includes("--dry-run");

// Where the 21 source PDFs live ("<Subject Name> <Year>.pdf").
const SRC_DIR =
  "D:/Preparation for Competitive Examinations/Academic Programmes/Diploma/A.H.D.P/PYQ of AHDP Subjects";

// Filename stem → Subject.code. Three stems differ from the DB subject name
// (marked below), so mapping by code — never by name — is what keeps this
// unambiguous.
const STEM_TO_CODE = {
  "Animal Husbandry Extension": "AHDP-AHE-101",
  "Introductory Animal Breeding and Genetics": "AHDP-ABG-101", // DB name: "Introductory Animal Genetics"
  "Introductory Animal Management": "AHDP-VAM-101",
  "Introductory Animal Nutrition": "AHDP-VAN-201",
  "Introductory Animal Reproduction": "AHDP-VRE-201",
  "Introductory Veterinary Anatomy": "AHDP-VAN-101",
  "Introductory Veterinary Medicine": "AHDP-VME-201", // DB name: "Introductory Veterinary Clinical Medicine"
  "Introductory Veterinary Pharmacology": "AHDP-VPH-201",
  "Introductory Veterinary Physiology and Biochemistry": "AHDP-VPH-101", // DB name uses "&"
  "Minor Veterinary Surgery": "AHDP-VSU-201",
};

const IMMUTABLE_CACHE = "public, max-age=31536000, immutable"; // rule 2

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`FATAL: ${name} is missing from .env`);
    process.exit(1);
  }
  return v;
}

const dbUrl = requireEnv("DATABASE_URL");
const r2AccountId = requireEnv("R2_ACCOUNT_ID");
const r2AccessKey = requireEnv("R2_ACCESS_KEY_ID");
const r2SecretKey = requireEnv("R2_SECRET_ACCESS_KEY");
const r2Bucket = requireEnv("R2_BUCKET");
const mediaBase = requireEnv("R2_PUBLIC_BASE_URL").replace(/\/+$/, "");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
  forcePathStyle: true, // same shape as src/lib/r2.ts
});

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: dbUrl }),
});

const stats = { scanned: 0, uploaded: 0, inserted: 0, updated: 0, skipped: 0 };
const errors = [];

async function main() {
  const programme = await prisma.programme.findFirst({
    where: { name: "A.H.D.P." },
    select: { id: true },
  });
  if (!programme) throw new Error('programme "A.H.D.P." not found');

  const subjects = await prisma.subject.findMany({
    where: { programmeId: programme.id },
    select: { id: true, code: true, name: true },
  });
  const byCode = new Map(subjects.filter((s) => s.code).map((s) => [s.code, s]));

  const files = readdirSync(SRC_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort();
  console.log(`${DRY_RUN ? "[dry-run] " : ""}found ${files.length} PDFs in ${SRC_DIR}\n`);

  const seen = new Set(); // `${subjectId}|${year}` — one paper per subject+year

  for (const file of files) {
    stats.scanned += 1;
    try {
      const m = file.match(/^(.*?)\s+(\d{4})\.pdf$/i);
      if (!m) throw new Error("filename does not match '<Subject> <Year>.pdf'");
      const [, stem, yearStr] = m;
      const year = parseInt(yearStr, 10);

      const code = STEM_TO_CODE[stem];
      if (!code) throw new Error(`no subject mapping for stem "${stem}"`);
      const subject = byCode.get(code);
      if (!subject) throw new Error(`subject code ${code} not found in DB`);

      const dedupeKey = `${subject.id}|${year}`;
      if (seen.has(dedupeKey))
        throw new Error(`duplicate paper for ${code} ${year}`);
      seen.add(dedupeKey);

      const buf = readFileSync(join(SRC_DIR, file));
      if (buf.subarray(0, 4).toString("latin1") !== "%PDF")
        throw new Error("not a PDF (bad magic bytes)");

      // Content-addressed key: same bytes → same key (idempotent), changed
      // bytes → new key (the immutable cache can never serve stale content).
      const hash = createHash("sha1").update(buf).digest("hex").slice(0, 12);
      const key = `pyq/${code}/${year}-${hash}.pdf`;
      const url = `${mediaBase}/${key}`;
      const title = `${subject.name} Question Paper ${year}`;

      const existing = await prisma.studyMaterial.findFirst({
        where: { subjectId: subject.id, type: "PYQ", year },
        select: { id: true, url: true },
      });

      if (existing?.url === url) {
        stats.skipped += 1;
        console.log(`SKIP    ${code} ${year} (already uploaded)`);
        continue;
      }

      const sizeMb = (buf.length / (1024 * 1024)).toFixed(2);
      const action = existing ? "update" : "insert";

      if (DRY_RUN) {
        if (!existing) stats.inserted += 1;
        else stats.updated += 1;
        console.log(
          `DRY     ${code} ${year} ${sizeMb} MB -> ${key} (${action} row)`
        );
        continue;
      }

      await s3.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: key,
          Body: buf,
          ContentType: "application/pdf",
          CacheControl: IMMUTABLE_CACHE,
        })
      );
      stats.uploaded += 1;

      const data = {
        title,
        url,
        fileName: file,
        fileType: "PDF",
        isPublic: true,
      };
      if (existing) {
        await prisma.studyMaterial.update({
          where: { id: existing.id },
          data: { ...data, year },
        });
        stats.updated += 1;
        console.log(`UPDATE  ${code} ${year} ${sizeMb} MB -> ${key}`);
      } else {
        await prisma.studyMaterial.create({
          data: {
            ...data,
            type: "PYQ",
            year,
            subjectId: subject.id,
          },
        });
        stats.inserted += 1;
        console.log(`INSERT  ${code} ${year} ${sizeMb} MB -> ${key}`);
      }
    } catch (e) {
      errors.push(`${file}: ${e.message}`);
      console.error(`ERROR   ${file}: ${e.message}`);
    }
  }

  console.log(
    `\nscanned ${stats.scanned} | uploaded ${stats.uploaded} | inserted ${stats.inserted} | updated ${stats.updated} | skipped ${stats.skipped} | errors ${errors.length}`
  );
}

main()
  .catch((e) => {
    console.error("FATAL:", e);
    errors.push(String(e));
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(errors.length ? 1 : 0);
  });
