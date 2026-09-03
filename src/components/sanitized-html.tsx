"use client";

import { sanitizeHtml } from "@/lib/sanitize";

export default function SanitizedHtml({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
}
