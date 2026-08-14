import { issueSignedToken, presignUrl } from "@vercel/blob";

/**
 * Returns a short-lived signed GET URL for a private Vercel Blob object.
 * Must be called server-side (uses BLOB_READ_WRITE_TOKEN). Falls back to the
 * original URL if signing fails so the app never hard-crashes.
 */
export async function getSignedUrl(blobUrl: string | null | undefined): Promise<string> {
  if (!blobUrl) return "";
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return blobUrl;
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
    return presignedUrl;
  } catch (error) {
    console.error("getSignedUrl error:", error);
    return blobUrl;
  }
}
