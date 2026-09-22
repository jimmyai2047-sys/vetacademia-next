// Safe post-auth redirect helper (P0: ?redirect= vs ?callbackUrl= mismatch).
// Accepts either param name, only allows same-origin absolute paths.

export function getSafeRedirect(
  search: string | URLSearchParams,
  fallback = "/dashboard"
): string {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;
  const raw =
    params.get("redirect") || params.get("callbackUrl") || params.get("next") || "";
  if (!raw) return fallback;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Keep raw value if it isn't valid percent-encoding.
  }
  // Only allow in-app paths: must start with single "/" and not be protocol-relative.
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
  // Block api/auth internals and external-looking tricks.
  if (
    decoded.startsWith("/api/") ||
    decoded.includes("\\") ||
    decoded.toLowerCase().startsWith("/%2f")
  ) {
    return fallback;
  }
  return decoded || fallback;
}

export function getRedirectFromWindow(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;
  return getSafeRedirect(window.location.search, fallback);
}
