#!/usr/bin/env node
/**
 * Download the entire Vercel Blob store to a local folder, preserving pathnames.
 *
 *   node --env-file=.env scripts/export-blob-to-local.mjs [targetDir]
 *
 * Default target: ../media-backup  (outside the repo, git-ignored at the root)
 * Needs only BLOB_READ_WRITE_TOKEN. No AWS SDK, no Cloudflare account.
 *
 * This is the safety copy: once it completes, the media exists on your own disk
 * and the Vercel store can be cancelled/deleted whenever you like.
 */
import { list, issueSignedToken, presignUrl } from "@vercel/blob";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

const TARGET = resolve(process.argv[2] ?? join(process.cwd(), "..", "media-backup"));
const CONCURRENCY = 6;
const RETRIES = 3;

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN (run with --env-file=.env)");
  process.exit(1);
}

console.log("Target:", TARGET);

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
  const t = await issueSignedToken({
    token,
    pathname,
    operations: ["get"],
    validUntil: Date.now() + 10 * 60 * 1000,
  });
  const { presignedUrl } = await presignUrl(t, {
    operation: "get",
    pathname,
    access: "private",
  });
  return presignedUrl;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function saveOne(blob) {
  const key = new URL(blob.url).pathname.replace(/^\//, "");
  const full = resolve(TARGET, key);
  if (!full.startsWith(resolve(TARGET) + sep)) {
    return { key, status: "skipped-unsafe-path" };
  }

  try {
    const s = await stat(full);
    if (s.size === blob.size) return { key, status: "already-present", size: s.size };
  } catch {
    /* not there yet */
  }

  let lastErr;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const url = await signedUrlFor(key);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = Buffer.from(await res.arrayBuffer());
      if (body.length !== blob.size) {
        throw new Error(`size mismatch ${body.length}/${blob.size}`);
      }
      await mkdir(dirname(full), { recursive: true });
      await writeFile(full, body);
      return { key, status: "saved", size: body.length };
    } catch (e) {
      lastErr = e;
      if (String(e.message).includes("suspended")) break;
      await sleep(400 * attempt);
    }
  }
  return { key, status: "failed", error: String(lastErr?.message) };
}

const blobs = await enumerate();
const totalBytes = blobs.reduce((s, b) => s + (b.size ?? 0), 0);
console.log(
  `Found ${blobs.length} objects, ${(totalBytes / 1024 / 1024).toFixed(2)} MB`
);

const results = new Array(blobs.length);
let next = 0;
let done = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < blobs.length) {
      const i = next++;
      results[i] = await saveOne(blobs[i]);
      done++;
      if (done % 100 === 0 || done === blobs.length) {
        process.stdout.write(`  ${done}/${blobs.length}\n`);
      }
    }
  })
);

const summary = results.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] ?? 0) + 1;
  return acc;
}, {});

const savedBytes = results
  .filter((r) => r.status === "saved" || r.status === "already-present")
  .reduce((s, r) => s + (r.size ?? 0), 0);

const report = {
  generatedAt: new Date().toISOString(),
  target: TARGET,
  sourceCount: blobs.length,
  sourceBytes: totalBytes,
  savedBytes,
  summary,
  failures: results.filter((r) => r.status === "failed"),
};

await mkdir(TARGET, { recursive: true });
const out = join(TARGET, `_export-report-${Date.now()}.json`);
await writeFile(out, JSON.stringify(report, null, 2));

console.log("\nSummary:", summary);
console.log(
  `Local size: ${(savedBytes / 1024 / 1024).toFixed(2)} MB of ${(
    totalBytes / 1024 / 1024
  ).toFixed(2)} MB`
);
console.log("Report:", out);
if (report.failures.length) process.exit(1);
