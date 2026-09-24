import crypto from "crypto";

// Server-only. Short-lived HMAC tokens that authorize /api/blob fetches made
// by external server-side viewers (Google Docs / Office Online) which cannot
// send the user's session cookies.
//
// A token binds ONE blob URL to an expiry timestamp:
//   sig = HMAC_SHA256(NEXTAUTH_SECRET, "<blobUrl>.<exp>")
// It carries no user identity on purpose — pages that already enforce their
// own paywall (reader, papers, mock-tests) mint tokens at render time, so a
// leaked/proxied URL stops working after ~2h instead of forever.

export const BLOB_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

function signingSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) {
    throw new Error(
      "NEXTAUTH_SECRET is not configured. Blob viewer tokens cannot be signed."
    );
  }
  return s;
}

// Builds a tokenized /api/blob URL for a private blob. Call from server
// components / route handlers only (needs the secret).
export function signBlobViewerUrl(blobUrl: string, ttlMs = BLOB_TOKEN_TTL_MS): string {
  const exp = Math.floor((Date.now() + ttlMs) / 1000);
  const sig = crypto
    .createHmac("sha256", signingSecret())
    .update(`${blobUrl}.${exp}`)
    .digest("base64url");
  return `/api/blob?url=${encodeURIComponent(blobUrl)}&exp=${exp}&sig=${sig}`;
}

// Verifies a tokenized request. Returns false on any mismatch or expiry.
export function verifyBlobViewerToken(
  blobUrl: string | null | undefined,
  exp: string | null | undefined,
  sig: string | null | undefined
): boolean {
  if (!blobUrl || !exp || !sig) return false;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum * 1000 < Date.now()) return false;
  let expected: string;
  try {
    expected = crypto
      .createHmac("sha256", signingSecret())
      .update(`${blobUrl}.${exp}`)
      .digest("base64url");
  } catch {
    return false;
  }
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sig, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
