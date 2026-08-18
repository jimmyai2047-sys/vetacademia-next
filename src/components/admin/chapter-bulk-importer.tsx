"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mammoth from "mammoth";
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
  const doc = new DOMParser().parseFromString(html, "text/html");
  const imgs = doc.querySelectorAll("img");
  const dataUrls: string[] = [];
  imgs.forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (src.startsWith("data:image/")) dataUrls.push(src);
  });
  if (dataUrls.length === 0) return html;

  const urlMap = new Map<string, string>();
  for (let i = 0; i < dataUrls.length; i++) {
    const dataUrl = dataUrls[i];
    if (urlMap.has(dataUrl)) continue;
    onProgress(`Uploading image ${i + 1}/${dataUrls.length}...`);
    const blobUrl = await uploadDataUrl(dataUrl);
    urlMap.set(dataUrl, blobUrl);
  }

  imgs.forEach((img) => {
    const src = img.getAttribute("src") || "";
    const mapped = urlMap.get(src);
    if (mapped && mapped !== src) {
      img.setAttribute("src", mapped);
      img.removeAttribute("srcset");
    }
  });
  return doc.body.innerHTML;
}

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
      setStatus("File parse ho rahi hai browser mein...");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        { convertImage: mammoth.images.dataUri as any }
      );
      const html = result.value;
      if (!html || html.replace(/<[^>]*>/g, "").trim().length === 0) {
        setError("File mein content nahi mila.");
        return;
      }

      const doc = new DOMParser().parseFromString(html, "text/html");
      const nodes = doc.body.childElementCount === 1
        ? Array.from(doc.body.firstElementChild!.childNodes)
        : Array.from(doc.body.childNodes);

      const isHeading = (n: Node) =>
        n.nodeType === 1 && /^H[1-4]$/.test((n as Element).tagName);

      type Section = { title: string; nodes: Node[] };
      const sections: Section[] = [];
      let cur: Section | null = null;
      const flush = () => {
        if (!cur) return;
        sections.push(cur);
        cur = null;
      };
      nodes.forEach((n) => {
        if (isHeading(n)) {
          flush();
          cur = {
            title: (n as Element).textContent?.trim() || `Unit ${sections.length + 1}`,
            nodes: [],
          };
        } else {
          if (!cur) cur = { title: sections.length === 0 ? "Introduction" : `Unit ${sections.length + 1}`, nodes: [] };
          cur.nodes.push(n);
        }
      });
      flush();

      if (sections.length === 0) {
        setError("File mein headings nahi mili.");
        return;
      }

      if (replace) {
        setStatus("Purane chapters delete ho rahe hain...");
        await fetch(`/api/admin/chapters`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId }),
        });
      }

      let createdCount = 0;
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const div = doc.createElement("div");
        section.nodes.forEach((n) => div.appendChild(n.cloneNode(true)));
        let chapterHtml = div.innerHTML;

        setStatus(`Chapter ${i + 1}/${sections.length}: "${section.title}" - images upload ho rahi hain...`);
        chapterHtml = await processImagesInHtml(chapterHtml, (msg) => setStatus(`Chapter ${i + 1}/${sections.length}: "${section.title}" - ${msg}`));

        setStatus(`Chapter ${i + 1}/${sections.length}: "${section.title}" save ho raha hai...`);
        const res = await fetch("/api/admin/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectId,
            chapters: [{
              title: section.title,
              content: chapterHtml,
              unitNumber: i + 1,
              type: null,
            }],
          }),
        });

        if (res.ok) createdCount++;
      }

      setDone(createdCount);
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
        <h2 className="font-semibold">Bulk Import — .docx file upload karein</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Apni Word (.docx) file select karein. File browser mein mammoth.js se
        parse hogi, images automatically upload ho jayengi, aur headings se
        chapters split hoke save ho jayenge.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
        Is subject ke purane chapters replace karein
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
