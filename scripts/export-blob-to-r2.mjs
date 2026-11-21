#!/usr/bin/env node
/**
 * Export the Vercel Blob store to Cloudflare R2, preserving pathnames.
 *
 *   npm i -D @aws-sdk/client-s3          (one-off; not needed at runtime)
 *   node --env-file=.env scripts/export-blob-to-r2.mjs --dry-run
 *   node --env-file=.env scripts/export-blob-to-r2.mjs --skip-existing
 *
 * Required env:
 *   BLOB_READ_WRITE_TOKEN              (already in .env)
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID                   (R2 API token: Object Read & Write)
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET                          e.g. vetacademia-media
 *
 * Notes:
 * - Preserves the object key exactly (chapters/x.webp -> chapters/x.webp), so
 *   the database needs no rewrite: src/lib/blob.ts derives the key from the URL.
 * - Blob signing is suspended while the Vercel team is paused. This script will
 *   fail with "This store has been suspended" until the Pro upgrade or the
 *   18 Dec 2026 unpause. Listing works either way, so --dry-run is safe today.
 * - Writes objects with immutable cache headers (rule 2 in AGENTS.md).
 */
import { list, issueSignedToken, presignUrl } from "@vercel/blob";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { writeFileSync } from "node:fs";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const SKIP_EXISTING = args.has("--skip-existing");
const CONCURRENCY = 4;
const RETRIES = 3;

const need = (name) => {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
};

const BLOB_TOKEN = need("BLOB_READ_WRITE_TOKEN");
const R2_BUCKET = DRY_RUN ? process.env.R2_BUCKET ?? "(unset)" : need("R2_BUCKET");

const s3 = DRY_RUN
  ? null
  : new S3Client({
      region: "auto",
      endpoint: `https://${need("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: need("R2_ACCESS_KEY_ID"),
        secretAccessKey: need("R2_SECRET_ACCESS_KEY"),
      },
    });

const CONTENT_TYPES = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  mp4: "video/mp4",
  webm: "video/webm",
  m3u8: "application/vnd.apple.mpegurl",
  ts: "video/mp2t",
  ttf: "font/ttf",
  woff2: "font/woff2",
  json: "application/json",
  txt: "text/plain",
  zip: "application/zip",
};

const contentTypeFor = (key) =>
  CONTENT_TYPES[key.split(".").pop()?.toLowerCase()] ?? "application/octet-stream";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

async function enumerate() {
  const out = [];
  let cursor;
  do {
    const page = await list({ limit: 1000, cursor });
    out.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

async function signedUrlFor(pathname) {
  const token = await issueSignedToken({
    token: BLOB_TOKEN,
    pathname,
    operations: ["get"],
    validUntil: Date.now() + 10 * 60 * 1000,
  });
  const { presignedUrl } = await presignUrl(token, {
    operation: "get",
    pathname,
    access: "private",
  });
  return presignedUrl;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function copyOne(blob) {
  const key = new URL(blob.url).pathname.replace(/^\//, "");

  if (DRY_RUN) return { key, status: "dry-run", size: blob.size };

  if (SKIP_EXISTING) {
    try {
      const head = await s3.send(
        new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key })
      );
      if (head.ContentLength === blob.size) {
        return { key, status: "already-present", size: blob.size };
      }
    } catch {
      /* not found -> fall through */
    }
  }

  let lastErr;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const url = await signedUrlFor(key);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`blob fetch ${res.status} ${res.statusText}`);
      const body = Buffer.from(await res.arrayBuffer());
      if (body.length !== blob.size) {
        throw new Error(`size mismatch: got ${body.length}, expected ${blob.size}`);
      }

      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: body,
          ContentType: contentTypeFor(key),
          CacheControl: CACHE_CONTROL,
          ContentLength: body.length,
        })
      );

      const head = await s3.send(
        new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key })
      );
      if (head.ContentLength !== blob.size) {
        throw new Error(
          `verify failed: R2 has ${head.ContentLength}, expected ${blob.size}`
        );
      }

      return { key, status: "copied", size: blob.size };
    } catch (err) {
      lastErr = err;
      if (String(err.message).includes("suspended")) break; // no point retrying
      await sleep(500 * attempt);
    }
  }
  return { key, status: "failed", size: blob.size, error: String(lastErr?.message) };
}

async function runPool(items, worker, limit) {
  const results = [];
  let i = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
      const r = results[idx];
      const tag =
        r.status === "copied" ? "ok" : r.status === "failed" ? "FAIL" : r.status;
      console.log(`[${idx + 1}/${items.length}] ${tag}  ${r.key}`);
    }
  });
  await Promise.all(runners);
  return results;
}

const blobs = await enumerate();
const totalBytes = blobs.reduce((s, b) => s + (b.size ?? 0), 0);
console.log(
  `Found ${blobs.length} objects, ${(totalBytes / 1024 / 1024).toFixed(2)} MB` +
    (DRY_RUN ? "  [dry run]" : `  -> ${R2_BUCKET}`)
);

const results = await runPool(blobs, copyOne, CONCURRENCY);

const summary = results.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] ?? 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  bucket: R2_BUCKET,
  dryRun: DRY_RUN,
  sourceCount: blobs.length,
  sourceBytes: totalBytes,
  summary,
  failures: results.filter((r) => r.status === "failed"),
  objects: results,
};

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const out = `backups/r2-export-${DRY_RUN ? "dryrun" : "report"}-${stamp}.json`;
writeFileSync(out, JSON.stringify(report, null, 2));

console.log("\nSummary:", summary);
console.log("Report:", out);
if (report.failures.length) {
  console.error(`${report.failures.length} failures — re-run with --skip-existing to resume.`);
  process.exit(1);
}
