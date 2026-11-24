import { env } from "./env";

// Media now lives in Cloudflare R2 and is served publicly (no signing) from the
// bucket's custom domain. Every stored object carries
// `Cache-Control: public, max-age=31536000, immutable`, so the URL returned here
// is permanent — unlike Vercel Blob's signed URLs, it never expires.
//
// The R2 key equals the old Blob `pathname`, which means the mapping is a pure
// string transform and **no database rewrite is needed**: any historical
// `https://<store>.blob.vercel-storage.com/<pathname>` becomes
// `https://media.vetacademia.in/<pathname>`.

const MEDIA_BASE = env.R2_PUBLIC_BASE_URL; // https://media.vetacademia.in
const MEDIA_HOST = new URL(MEDIA_BASE).hostname;

/** Extracts the object key from any URL shape we may have stored over time. */
function toObjectKey(blobUrl: string): string {
  const pathname = new URL(blobUrl).pathname;
  return pathname.replace(/^\/+/, "");
}

/**
 * True when a URL points at one of our own storage hosts — the R2 media domain
 * or the legacy Vercel Blob store. Used by avatar/profile validators so that
 * only our own files can be linked from an account (prevents arbitrary remote
 * URLs being stored as profile media).
 */
export function isOurMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host === MEDIA_HOST || host.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/**
 * Synchronous, client-safe form of {@link getSignedUrl}: a pure string
 * transform with no async work (the async signature of getSignedUrl exists
 * only for compatibility with its ~30 call sites).
 *
 * Used wherever a legacy Blob URL must become a direct media URL at render
 * time — in particular anything fed into `next/image`, because the image
 * optimizer fetches URLs in-process and cannot follow `/api/blob`'s 307.
 */
export function toMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  // Local public files need no storage lookup — return as-is.
  if (url.startsWith("/")) return url;

  try {
    const parsed = new URL(url);
    // Already on our media domain (or any non-Blob absolute URL we don't own).
    if (parsed.hostname === MEDIA_HOST) return url;
    if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) return url;

    return `${MEDIA_BASE}/${toObjectKey(url)}`;
  } catch (error) {
    // Malformed URL — never hard-crash a render over a link.
    console.error("toMediaUrl error:", error);
    return url;
  }
}

/**
 * Returns a publicly-cacheable URL for a stored media object.
 * Must be called server-side. Kept `async` (and the same signature as the old
 * Vercel Blob signer) so the ~30 existing call sites need no changes.
 *
 * Local public files (e.g. /proformas/...) and URLs already pointing at the R2
 * domain are returned untouched.
 */
export async function getSignedUrl(blobUrl: string | null | undefined): Promise<string> {
  return toMediaUrl(blobUrl);
}
