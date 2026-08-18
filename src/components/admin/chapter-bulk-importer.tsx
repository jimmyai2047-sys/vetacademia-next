"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Check,
  Layers,
  FileUp,
  AlertTriangle,
} from "lucide-react";

const CHUNK_SIZE = 3 * 1024 * 1024;

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
  const [progress, setProgress] = useState<string | null>(null);

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
      setStatus("File padh rahi hai...");
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`;

      const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
      setStatus(`File ${totalChunks} parts mein split ho rahi hai...`);

      const initRes = await fetch("/api/admin/chapters/import-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init", filename: file.name, totalChunks }),
      });
      if (!initRes.ok) {
        const t = await initRes.text();
        setError(`Init failed: ${t.slice(0, 200)}`);
        setStatus(null);
        return;
      }
      const { sessionId } = await initRes.json();

      for (let i = 0; i < totalChunks; i++) {
        const chunk = dataUrl.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        setProgress(`${i + 1}/${totalChunks}`);

        const isLast = i === totalChunks - 1;
        const chunkBody: Record<string, unknown> = {
          action: "chunk",
          sessionId,
          index: i,
          data: chunk,
        };
        if (isLast) {
          chunkBody.subjectId = subjectId;
          chunkBody.replace = replace;
        }

        const chunkRes = await fetch("/api/admin/chapters/import-docx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chunkBody),
        });

        const text = await chunkRes.text();
        let d: Record<string, unknown>;
        try {
          d = JSON.parse(text);
        } catch {
          setError(`Chunk ${i + 1} error (${chunkRes.status}): ${text.slice(0, 200)}`);
          setStatus(null);
          setProgress(null);
          return;
        }

        if (!chunkRes.ok) {
          setError((d.error as string) || `Chunk ${i + 1} failed`);
          setStatus(null);
          setProgress(null);
          return;
        }

        if (isLast && d.created !== undefined) {
          setDone(d.created as number);
          setStatus(null);
          setProgress(null);
          router.refresh();
        }
      }
    } catch (err) {
      console.error("Import error:", err);
      setError(`Import failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setStatus(null);
      setProgress(null);
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
        Apni Word (.docx) file select karein. File browser se chhote-chhote
        parts mein server pe bheji jayegi. Images bhi automatically upload
        ho jayengi. <strong>Koi size limit nahi hai.</strong>
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
      {progress && (
        <p className="text-sm text-blue-600">{progress}</p>
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
