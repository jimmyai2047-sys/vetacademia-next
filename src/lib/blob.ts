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
 * Returns a publicly-cacheable URL for a stored media object.
 * Must be called server-side. Kept `async` (and the same signature as the old
 * Vercel Blob signer) so the ~30 existing call sites need no changes.
 *
 * Local public files (e.g. /proformas/...) and URLs already pointing at the R2
 * domain are returned untouched.
 */
export async function getSignedUrl(blobUrl: string | null | undefined): Promise<string> {
  if (!blobUrl) return "";
  // Local public files need no storage lookup — return as-is.
  if (blobUrl.startsWith("/")) return blobUrl;

  try {
    const url = new URL(blobUrl);
    // Already on our media domain (or any non-Blob absolute URL we don't own).
    if (url.hostname === new URL(MEDIA_BASE).hostname) return blobUrl;
    if (!url.hostname.endsWith(".blob.vercel-storage.com")) return blobUrl;

    return `${MEDIA_BASE}/${toObjectKey(blobUrl)}`;
  } catch (error) {
    // Malformed URL — never hard-crash a render over a link.
    console.error("getSignedUrl error:", error);
    return blobUrl;
  }
}
