import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { getSignedUrl } from "@/lib/blob";
import { sanitizeChapterContent } from "@/lib/content";

const INLINE_IMG_RE =
  /<img\b[^>]*\ssrc=["'](data:image\/([a-zA-Z0-9.+-]+);base64,([^"']+))["'][^>]*>/gi;

const BLOB_IMG_RE =
  /<img\b[^>]*\ssrc=["'](https:\/\/[^"']*blob\.vercel-storage\.com\/[^"']+)["'][^>]*>/gi;

const MAX_INLINE_IMAGES = 60;
const MAX_DIMENSION = 1600;

/**
 * Uploads inline base64 images (e.g. pasted from Word) to Vercel Blob and
 * rewrites the HTML to reference the Blob URLs instead. This keeps the stored
 * HTML small, lets images be CDN-cached, and avoids shipping multi-MB base64
 * blobs to the browser. Images are compressed/resized via sharp when available.
 */
export async function processInlineImages(html: string): Promise<string> {
  if (!html || !/data:image\//.test(html)) return html;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return html; // no Blob token (local dev) → keep base64

  const matches = [...html.matchAll(INLINE_IMG_RE)].slice(0, MAX_INLINE_IMAGES);
  let out = html;

  for (const m of matches) {
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
          const resized = await sharp(buffer)
            .rotate()
            .resize({ width: MAX_DIMENSION, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();
          buffer = resized;
          ext = "webp";
        } catch {
          // sharp unavailable or failed → keep original bytes
        }
      }

      const path = `chapters/${randomUUID()}.${ext}`;
      const blob = await put(path, buffer, {
        access: "private",
        token,
        addRandomSuffix: false,
        multipart: true,
      });
      out = out.split(dataUrl).join(blob.url);
    } catch (err) {
      console.error("processInlineImages: upload failed for one image", err);
    }
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
  let signed = html;
  const matches = [...html.matchAll(BLOB_IMG_RE)];
  for (const m of matches) {
    const url = m[1];
    try {
      const s = await getSignedUrl(url);
      if (s && s !== url) signed = signed.split(url).join(s);
    } catch {
      // keep original on failure
    }
  }
  return sanitizeChapterContent(signed);
}
