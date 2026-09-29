"use client";

import { useSyncExternalStore } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

const subscribeNoop = () => () => {};

export default function SanitizedHtml({ html, className }: { html: string; className?: string }) {
  // DOMPurify has no `window` during SSR (its default export then lacks
  // `.sanitize`), so sanitizing during the server pass crashed it and the
  // blog post body never made it into the SSR output. Gate the (browser-only)
  // sanitize behind a hydration flag: server and first client render stay
  // empty and identical; once hydrated, sanitize runs in render — still in
  // the browser, still before dangerouslySetInnerHTML.
  const isHydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: isHydrated ? sanitizeHtml(html) : "" }}
    />
  );
}
