"use client";

import { useEffect, useRef } from "react";
import DOMPurify, { type Config } from "dompurify";
import { postProcessContent } from "@/lib/dom-utils";

const SANITIZE_OPTS: Config = {
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
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

export default function ProtectedHtml({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !html) return;
    const clean = DOMPurify.sanitize(html, SANITIZE_OPTS);
    ref.current.innerHTML = clean;
    postProcessContent(ref.current);
  }, [html]);

  return (
    <div
      ref={ref}
      className="chapter-content"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    />
  );
}
