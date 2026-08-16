import { issueSignedToken, presignUrl } from "@vercel/blob";

// Cache signed URLs. They are valid for 60 min, so we cache for 50 min to stay
// safely within the validity window and avoid re-signing on every render/request
// (the syllabus pages otherwise trigger one signing call per Blob image).
const CACHE_TTL_MS = 50 * 60 * 1000;
const cache = new Map<string, { url: string; expires: number }>();

/**
 * Returns a short-lived signed GET URL for a private Vercel Blob object.
 * Must be called server-side (uses BLOB_READ_WRITE_TOKEN). Falls back to the
 * original URL if signing fails so the app never hard-crashes.
 */
export async function getSignedUrl(blobUrl: string | null | undefined): Promise<string> {
  if (!blobUrl) return "";
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return blobUrl;

  const cached = cache.get(blobUrl);
  if (cached && cached.expires > Date.now()) {
    return cached.url;
  }

  try {
    const pathname = new URL(blobUrl).pathname.replace(/^\//, "");
    const validUntil = Date.now() + 60 * 60 * 1000;
    const signedToken = await issueSignedToken({
      token,
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
  }
}
