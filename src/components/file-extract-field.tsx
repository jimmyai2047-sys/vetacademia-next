"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { extractDocumentToHtml } from "@/lib/extract-document";

const ACCEPT = ".docx,.xlsx,.xls,.pdf,.txt,.md,.csv,.html,.htm";

export default function FileExtractField({
  label,
  onExtracted,
}: {
  label: string;
  onExtracted: (html: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const html = await extractDocumentToHtml(file);
      onExtracted(html);
    } catch {
      setError("Could not read this file. Try copy-pasting the text instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {busy ? "Extracting…" : `Upload ${label} file`}
        <input
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handle}
          disabled={busy}
        />
      </label>
      <span className="text-xs text-muted-foreground">
        Excel, Word, PDF, or text — content is extracted below
      </span>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
