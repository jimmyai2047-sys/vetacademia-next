"use client";

import { useEffect, useState } from "react";
import DOMPurify, { type Config } from "dompurify";

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
    "style",
  ],
};

export default function ProtectedHtml({ html }: { html: string }) {
  const [clean, setClean] = useState("");

  useEffect(() => {
    if (!html) {
      setClean("");
      return;
    }
    setClean(DOMPurify.sanitize(html, SANITIZE_OPTS));
  }, [html]);

  return (
    <div
      className="chapter-content"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
