import { put } from "@/lib/r2";
import { randomUUID } from "crypto";
import { getSignedUrl } from "@/lib/blob";
import { sanitizeChapterContent } from "@/lib/content";
import { env } from "@/lib/env";

const INLINE_IMG_RE =
  /<img\b[^>]*\ssrc=["'](data:image\/([a-zA-Z0-9.+-]+);base64,([^"']+))["'][^>]*>/gi;

const BLOB_IMG_RE =
  /<img\b[^>]*\ssrc=["'](https:\/\/[^"']*blob\.vercel-storage\.com\/[^"']+)["'][^>]*>/gi;

const MAX_INLINE_IMAGES = 60;
const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 72;

/**
 * Uploads inline base64 images (e.g. pasted from Word) to Cloudflare R2 and
 * rewrites the HTML to reference the public media URLs instead. This keeps the stored
 * HTML small, lets images be CDN-cached, and avoids shipping multi-MB base64
 * blobs to the browser. Images are compressed/resized via sharp when available.
 * Client-side compression should also be applied before calling this.
 */
export async function processInlineImages(html: string): Promise<string> {
  if (!html || !/data:image\//.test(html)) return html;
  if (!env.R2_ACCESS_KEY_ID) return html; // no R2 creds (local dev) → keep base64

  const matches = [...html.matchAll(INLINE_IMG_RE)].slice(0, MAX_INLINE_IMAGES);

  const uploads = await Promise.all(
    matches.map(async (m) => {
      const dataUrl = m[1];
      const mime = m[2];
      const b64 = m[3];
      try {
        let buffer = Buffer.from(b64, "base64");
        let ext = (mime.split("/")[1] || "png").replace("+xml", "");
        if (ext === "jpeg") ext = "jpg";
        if (ext === "svg") ext = "svg"; // don't re-encode svg

        if (ext !== "svg") {
          try {
            const sharp = (await import("sharp")).default;
            const meta = await sharp(buffer).metadata();
            const isLarge = buffer.length > 50 * 1024 || (meta.width && meta.width > MAX_DIMENSION);
            if (isLarge) {
              const resized = await sharp(buffer)
                .rotate()
                .resize({ width: MAX_DIMENSION, withoutEnlargement: true })
                .webp({ quality: WEBP_QUALITY })
                .toBuffer();
              buffer = resized;
              ext = "webp";
            } else {
              ext = "webp";
              buffer = await sharp(buffer).webp({ quality: WEBP_QUALITY }).toBuffer();
            }
          } catch {
            // sharp unavailable or failed → keep original bytes
          }
        }

        const path = `chapters/${randomUUID()}.${ext}`;
        const uploaded = await put(path, buffer);
        return { dataUrl, url: uploaded.url };
      } catch (err) {
        console.error("processInlineImages: upload failed for one image", err);
        return null;
      }
    })
  );

  let out = html;
  for (const r of uploads) {
    if (r) out = out.split(r.dataUrl).join(r.url);
  }
  return out;
}

/**
 * Pre-renders stored chapter HTML for the browser: signs any private Blob image
 * URLs (so they are actually loadable) and sanitizes. Returns HTML safe to pass
 * to ProtectedHtml.
 */
export async function prepareChapterHtml(html: string): Promise<string> {
  if (!html) return html;
  const matches = [...html.matchAll(BLOB_IMG_RE)];
  const signed = await Promise.all(
    matches.map(async (m) => {
      const url = m[1];
      try {
        const s = await getSignedUrl(url);
        if (s && s !== url) return { url, signed: s };
      } catch {
        // keep original on failure
      }
      return { url, signed: url };
    })
  );
  let out = html;
  for (const r of signed) out = out.split(r.url).join(r.signed);
  // Re-sanitize: chapter-reader injects this via raw dangerouslySetInnerHTML,
  // so it must be sanitized here (single chapter/course → negligible cost).
  return sanitizeChapterContent(out);
}
