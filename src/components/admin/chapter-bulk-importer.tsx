"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Check,
  Layers,
  FileUp,
  AlertTriangle,
} from "lucide-react";

export default function ChapterBulkImporter({
  subjectId,
}: {
  subjectId: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [replace, setReplace] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx") && !file.name.endsWith(".doc")) {
      setError("Sirf .docx file upload karein.");
      return;
    }

    setCreating(true);
    setError(null);
    setDone(null);

    try {
      // Step 1: Upload directly to Blob from browser (bypasses 4.5MB serverless limit!)
      setStatus("File directly Blob storage mein upload ho rahi hai...");
      const blobResult = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/admin/upload-client",
      });

      // Step 2: Send Blob URL to server for parsing
      setStatus("Upload ho gaya! Ab server pe chapters ban rahe hain...");
      const res = await fetch("/api/admin/chapters/import-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: blobResult.url,
          subjectId,
          replace,
        }),
      });

      const text = await res.text();
      let d: Record<string, unknown>;
      try {
        d = JSON.parse(text);
      } catch {
        setError(`Server error (${res.status}): ${text.slice(0, 300)}`);
        setStatus(null);
        return;
      }

      if (!res.ok) {
        setError((d.error as string) || "Chapters create nahi ho paye.");
        setStatus(null);
        return;
      }

      setDone((d.created as number) || 0);
      setStatus(null);
      router.refresh();
    } catch (err) {
      console.error("Import error:", err);
      setError(
        `Import failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setStatus(null);
    } finally {
      setCreating(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border p-5 bg-amber-50/40 space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-amber-600" />
        <h2 className="font-semibold">
          Bulk Import — .docx file upload karein
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Apni Word (.docx) file select karein. File directly browser se Blob
        storage mein upload hogi (no serverless limit), phir server pe mammoth.js
        se parse hoke chapters ban jayenge.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={replace}
          onChange={(e) => setReplace(e.target.checked)}
        />
        Is subject ke purane chapters replace karein
      </label>

      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".docx,.doc"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={creating}
          className="gap-2"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="h-4 w-4" />
          )}
          {creating ? "Processing..." : "Select .docx File"}
        </Button>
      </div>

      {status && (
        <p className="text-sm text-blue-600 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {status}
        </p>
      )}
      {done !== null && (
        <p className="text-sm text-green-600 flex items-center gap-2">
          <Check className="h-4 w-4" /> {done} chapters successfully create ho gaye!
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
