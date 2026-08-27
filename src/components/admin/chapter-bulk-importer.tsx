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

async function uploadDataUrl(dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return dataUrl;
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: `image/${ext}` });
  const file = new File([blob], `img-${Date.now()}.${ext}`, { type: `image/${ext}` });
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) return dataUrl;
  const data = await res.json();
  return data.url || data.downloadUrl || dataUrl;
}

async function processImagesInHtml(html: string, onProgress: (msg: string) => void): Promise<string> {
  const regex = /<img\b[^>]*\ssrc=["'](data:image\/[^"']+)["'][^>]*>/gi;
  const dataUrls = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) dataUrls.add(m[1]);
  if (dataUrls.size === 0) return html;

  const urlMap = new Map<string, string>();
  const arr = Array.from(dataUrls);
  for (let i = 0; i < arr.length; i++) {
    const dataUrl = arr[i];
    if (urlMap.has(dataUrl)) continue;
    onProgress(`Uploading image ${i + 1}/${arr.length}...`);
    const blobUrl = await uploadDataUrl(dataUrl);
    urlMap.set(dataUrl, blobUrl);
  }

  let out = html;
  for (const [old, fresh] of urlMap) {
    out = out.split(old).join(fresh);
  }
  return out;
}

function splitHtmlIntoTopicSections(html: string): { title: string; content: string }[] {
  const doc = new DOMParser().parseFromString(
    `<div id="__root">${html}</div>`,
    "text/html"
  );
  const root = doc.getElementById("__root");
  if (!root) return [{ title: "Section 1", content: html }];
  const children = Array.from(root.children);
  const sections: { title: string; content: string }[] = [];
  let current: { title: string; content: string } | null = null;
  let idx = 0;
  for (const el of children) {
    const tag = el.tagName.toLowerCase();
    if (tag === "h1" || tag === "h2" || tag === "h3") {
      if (current) sections.push(current);
      idx += 1;
      current = {
        title: (el.textContent || "").trim() || `Section ${idx}`,
        content: "",
      };
    } else {
      if (!current) {
        idx += 1;
        current = { title: `Section ${idx}`, content: "" };
      }
      current.content += el.outerHTML;
    }
  }
  if (current) sections.push(current);
  return sections.length ? sections : [{ title: "Section 1", content: html }];
}

export default function ChapterBulkImporter({
  subjectId,
}: {
  subjectId: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [replace, setReplace] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".docx") && !file.name.endsWith(".doc")) {
      setError("Please upload only .docx files.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter the chapter title first.");
      return;
    }

    setCreating(true);
    setError(null);
    setDone(false);

    try {
      setStatus("Parsing file...");
      const mammoth = (await import("mammoth/mammoth.browser.min.js")).default;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          convertImage: mammoth.images.imgElement((image) =>
            image.read("base64").then((data: string) => ({
              src: `data:${image.contentType};base64,${data}`,
              alt: image.alt || "",
            }))
          ),
        }
      );
      const html = result.value;
      if (!html || html.replace(/<[^>]*>/g, "").trim().length === 0) {
        setError("No content found in the file.");
        return;
      }

      setStatus("Uploading images...");
      const cleanedHtml = await processImagesInHtml(html, (msg) => setStatus(msg));

      setStatus("Saving chapter...");
      const sections = splitHtmlIntoTopicSections(cleanedHtml);

      const res = await fetch("/api/admin/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          replace,
          chapters: [{
            title: title.trim(),
            content: "",
            unitNumber: 1,
            type: null,
          }],
        }),
      });

      const text = await res.text();
      let d: Record<string, unknown>;
      try {
        d = JSON.parse(text);
      } catch {
        setError(`Server error (${res.status}): ${text.slice(0, 300)}`);
        return;
      }

      if (!res.ok) {
        setError((d.error as string) || "Could not save chapter.");
        return;
      }

      const createdIds = (d.createdIds as string[] | undefined) ?? [];
      const chapterId = createdIds[0];
      if (!chapterId) {
        setError("Chapter was created but ID was not returned.");
        return;
      }

      setStatus(`Saving sections (${sections.length})...`);
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        const sr = await fetch("/api/admin/chapter-sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId,
            title: s.title,
            content: s.content,
            order: i,
          }),
        });
        if (!sr.ok) {
          console.error("Section create failed", await sr.text());
        }
      }

      setDone(true);
      setStatus(null);
      router.refresh();
    } catch (err) {
      console.error("Import error:", err);
      setError(`Import failed: ${err instanceof Error ? err.message : "Unknown error"}`);
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
        <h2 className="font-semibold">Upload .docx Chapter</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Select a Word file. It will be parsed in the browser, images will be
        uploaded automatically, and saved as a single chapter.
      </p>

      <div className="space-y-2">
        <label className="text-sm font-medium">Chapter Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Chapter 1 - Economic Importance of Animal Husbandry in Rajasthan"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          disabled={creating}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
        Replace existing chapters for this subject
      </label>

      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept=".docx,.doc" className="hidden" onChange={handleFileUpload} />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={creating} className="gap-2">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          {creating ? "Processing..." : "Select .docx File"}
        </Button>
      </div>

      {status && (
        <p className="text-sm text-blue-600 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {status}
        </p>
      )}
      {done && (
        <p className="text-sm text-green-600 flex items-center gap-2">
          <Check className="h-4 w-4" /> Chapter saved successfully!
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
