import { issueSignedToken, presignUrl } from "@vercel/blob";

// Cache signed URLs. They are valid for 60 min, so we cache for 50 min to stay
// safely within the validity window and avoid re-signing on every render/request
// (the syllabus pages otherwise trigger one signing call per Blob image).
const CACHE_TTL_MS = 50 * 60 * 1000;
declare global {
  var __VA_BLOB_URL_CACHE: Map<string, { url: string; expires: number }> | undefined;
  var __VA_BLOB_INFLIGHT: Map<string, Promise<string>> | undefined;
}
const cache: Map<string, { url: string; expires: number }> =
  globalThis.__VA_BLOB_URL_CACHE ?? (globalThis.__VA_BLOB_URL_CACHE = new Map());
// In-flight signing promises — concurrent renders for the same URL share one
// signing call instead of stampeding the Blob API when the cache is cold.
const inflight: Map<string, Promise<string>> =
  globalThis.__VA_BLOB_INFLIGHT ?? (globalThis.__VA_BLOB_INFLIGHT = new Map());

/**
 * Returns a short-lived signed GET URL for a private Vercel Blob object.
 * Must be called server-side (uses BLOB_READ_WRITE_TOKEN). Falls back to the
 * original URL if signing fails so the app never hard-crashes.
 */
export async function getSignedUrl(blobUrl: string | null | undefined): Promise<string> {
  if (!blobUrl) return "";
  // Local public files (e.g. /proformas/...) need no signing — return as-is.
  if (blobUrl.startsWith("/")) return blobUrl;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return blobUrl;

  const cached = cache.get(blobUrl);
  if (cached && cached.expires > Date.now()) {
    return cached.url;
  }
  // Cap cache size to prevent unbounded growth on long-lived instances.
  if (cache.size > 2000) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now > v.expires) cache.delete(k);
    }
  }

  const pending = inflight.get(blobUrl);
  if (pending) return pending;

  const signing = (async () => {
    try {
      const pathname = new URL(blobUrl).pathname.replace(/^\//, "");
      const validUntil = Date.now() + 60 * 60 * 1000;
      const signedToken = await issueSignedToken({
        token: token as string,
        pathname,
        operations: ["get"],
        validUntil,
      });
      const { presignedUrl } = await presignUrl(signedToken, {
        operation: "get",
        pathname,
        access: "private",
      });
      cache.set(blobUrl, { url: presignedUrl, expires: validUntil - 10 * 60 * 1000 });
      return presignedUrl;
    } catch (error) {
      console.error("getSignedUrl error:", error);
      return blobUrl;
    } finally {
      inflight.delete(blobUrl);
    }
  })();
  inflight.set(blobUrl, signing);
  return signing;
}
