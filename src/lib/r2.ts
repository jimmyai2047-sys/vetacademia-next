import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

/**
 * Cloudflare R2 storage helpers — the drop-in replacement for `@vercel/blob`
 * (`put` / `del` keep the same call signature, so call sites only change their
 * import). Objects are written with immutable cache headers (rule 2 in
 * AGENTS.md) and read back through the public custom domain, never through the
 * Next.js server (rule 1).
 *
 * The object key is the path we pass in — identical to the old Blob pathname —
 * which is why the database needs no rewrite.
 */

// Content-addressed keys (UUID/timestamp in the path) never change, so they can
// be cached for a year. Rule 2.
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

let shared: S3Client | null = null;
function s3(): S3Client {
  if (!shared) {
    const accountId = env.R2_ACCOUNT_ID;
    const accessKeyId = env.R2_ACCESS_KEY_ID;
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
    // Fail closed with a clear message rather than an opaque SDK auth error.
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY."
      );
    }
    shared = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      // Path-style keeps the bucket in the path: <endpoint>/<bucket>/<key>.
      forcePathStyle: true,
    });
  }
  return shared;
}

const EXT_CONTENT_TYPE: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
  ico: "image/x-icon",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json",
  html: "text/html; charset=utf-8",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  m3u8: "application/vnd.apple.mpegurl",
  ts: "video/mp2t",
};

function contentTypeFor(pathname: string, explicit?: string): string {
  if (explicit) return explicit;
  const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
  return EXT_CONTENT_TYPE[ext] ?? "application/octet-stream";
}

export interface PutResult {
  /** Public URL on the media domain — safe to store in the database. */
  url: string;
  /** Object key (= old Blob pathname). */
  pathname: string;
}

export interface PutOptions {
  contentType?: string;
  /** Defaults to `public, max-age=31536000, immutable` (rule 2). */
  cacheControl?: string;
  // Accepted and ignored — legacy `@vercel/blob` options kept so existing call
  // sites compile unchanged during the migration.
  access?: "private" | "public";
  token?: string;
  addRandomSuffix?: boolean;
  multipart?: boolean;
}

type Body = string | Uint8Array | ArrayBuffer | Blob;

async function toBytes(body: Body): Promise<Uint8Array | string> {
  if (typeof body === "string") return body;
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  // File / Blob (browser uploads arriving at a route handler).
  return new Uint8Array(await body.arrayBuffer());
}

/**
 * Uploads one object to R2 and returns its public URL.
 * Never buffers more than the single object being written, and never proxies
 * the bytes back out — downloads go straight from the CDN.
 */
export async function put(
  pathname: string,
  body: Body,
  options: PutOptions = {}
): Promise<PutResult> {
  const key = pathname.replace(/^\/+/, "");
  await s3().send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: await toBytes(body),
      ContentType: contentTypeFor(key, options.contentType),
      CacheControl: options.cacheControl ?? IMMUTABLE_CACHE,
    })
  );
  return { url: `${env.R2_PUBLIC_BASE_URL}/${key}`, pathname: key };
}

/**
 * Deletes an object. Accepts either a key or a full URL (the old Blob URL
 * stored in the database), mirroring `@vercel/blob`'s `del()`.
 */
export async function del(target: string, options: PutOptions = {}): Promise<void> {
  void options; // legacy `del(url, { token })` signature
  let key = target;
  try {
    if (/^https?:\/\//i.test(target)) key = new URL(target).pathname;
  } catch {
    // keep as-is
  }
  key = key.replace(/^\/+/, "");
  if (!key) return;
  await s3().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
}
