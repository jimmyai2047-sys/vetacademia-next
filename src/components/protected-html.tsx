"use client";

export default function ProtectedHtml({ html }: { html: string }) {
  return (
    <div
      className="chapter-content"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
