import DOMPurify, { type Config } from "dompurify";

export const SANITIZE_OPTS: Config = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "link", "base", "svg"],
  FORBID_ATTR: [
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "onmouseout",
    "onfocus",
    "onblur",
  ],
  // data: URIs are restricted to images only (chapter content embeds base64
// images) — data:text/html and other executable data: payloads are rejected.
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|sms|cid|xmpp):|data:image\/|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

// Sanitizes untrusted HTML (admin-authored chapter/docx content) before it is
// injected via dangerouslySetInnerHTML. Runs in the browser (client components).
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_OPTS);
}
