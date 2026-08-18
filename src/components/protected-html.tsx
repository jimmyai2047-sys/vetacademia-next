"use client";

import { useEffect, useRef } from "react";
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
  ],
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

function wrapImagesWithCaptions(root: HTMLElement) {
  // Find all <img> tags that are direct children of <p>
  const imgs = root.querySelectorAll("p > img, img");
  imgs.forEach((img) => {
    // Skip if already inside a figure
    if (img.closest("figure")) return;

    const imgP = img.parentElement?.tagName === "P" ? img.parentElement : img;

    // Check if next sibling is a <p> with <strong> or <em> containing "चित्र" or "Figure"
    const nextP = imgP.nextElementSibling;
    if (!nextP || nextP.tagName !== "P") return;

    const text = nextP.textContent?.trim() || "";
    const isCaption =
      /चित्र|figure|fig\.|diagram|map|chart|table\s*of/i.test(text) &&
      nextP.querySelectorAll("img").length === 0;

    if (!isCaption) return;

    // Create <figure> wrapper
    const figure = document.createElement("figure");

    // Move img into figure
    const imgClone = imgP.cloneNode(true);
    figure.appendChild(imgClone);

    // Convert caption <p> to <figcaption>
    const figcaption = document.createElement("figcaption");
    figcaption.innerHTML = nextP.innerHTML;
    figure.appendChild(figcaption);

    // Replace original elements
    imgP.parentNode?.insertBefore(figure, imgP);
    imgP.remove();
    nextP.remove();
  });
}

export default function ProtectedHtml({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !html) return;
    const clean = DOMPurify.sanitize(html, SANITIZE_OPTS);
    ref.current.innerHTML = clean;

    // Wrap images + captions in <figure>
    wrapImagesWithCaptions(ref.current);

    // Wrap every <table> in a scrollable div
    ref.current.querySelectorAll("table").forEach((table) => {
      if (table.parentElement?.classList.contains("table-wrap")) return;
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      table.parentNode?.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
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
