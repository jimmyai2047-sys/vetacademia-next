"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  FileDown,
  Check,
  Layers,
} from "lucide-react";

type Section = {
  title: string;
  type: "THEORY" | "PRACTICAL";
  preview: string;
  html: string;
};

function splitHtmlByHeadings(
  html: string,
  defaultType: "THEORY" | "PRACTICAL"
): Section[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  let nodes: Node[] = Array.from(body.childNodes);
  // Word often wraps the pasted content in a single element — descend into it.
  if (body.childElementCount === 1) {
    nodes = Array.from((body.firstElementChild as Element).childNodes);
  }

  const isHeading = (n: Node) =>
    n.nodeType === 1 && /^H[1-4]$/.test((n as Element).tagName);

  const sections: Section[] = [];
  let cur: { title: string; nodes: Node[] } | null = null;

  const flush = () => {
    if (!cur) return;
    const div = doc.createElement("div");
    cur.nodes.forEach((n) => div.appendChild(n));
    sections.push({
      title: cur.title,
      type: /practical/i.test(cur.title) ? "PRACTICAL" : defaultType,
      preview: (div.textContent || "").replace(/\s+/g, " ").trim().slice(0, 140),
      html: div.innerHTML,
    });
    cur = null;
  };

  nodes.forEach((n) => {
    if (isHeading(n)) {
      flush();
      cur = {
        title:
          (n as Element).textContent?.trim() ||
          `Unit ${sections.length + 1}`,
        nodes: [],
      };
    } else {
      if (!cur) {
        cur = {
          title: sections.length === 0 ? "Introduction" : `Unit ${sections.length + 1}`,
          nodes: [],
        };
      }
      cur.nodes.push(n);
    }
  });
  flush();

  return sections;
}

export default function ChapterBulkImporter({
  subjectId,
}: {
  subjectId: string;
}) {
  const router = useRouter();
  const pasteRef = useRef<HTMLDivElement>(null);
  const [defaultType, setDefaultType] = useState<"THEORY" | "PRACTICAL">("THEORY");
  const [replace, setReplace] = useState(false);
  const [sections, setSections] = useState<Section[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  function preview() {
    const html = pasteRef.current?.innerHTML || "";
    const textOnly = html.replace(/<[^>]*>/g, "").trim();
    if (!textOnly) {
      setError("Pehle apni Word document ka content yahan paste (Ctrl+V) karein.");
      return;
    }
    const secs = splitHtmlByHeadings(html, defaultType);
    if (secs.length === 0) {
      setError("Koi content nahi mila.");
      return;
    }
    setSections(secs);
    setError(null);
    setDone(null);
  }

  async function uploadBase64Image(dataUrl: string): Promise<string> {
    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return dataUrl;
    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: `image/${ext}` });
    const file = new File([blob], `paste-${Date.now()}.${ext}`, { type: `image/${ext}` });
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) return dataUrl;
      const data = await res.json();
      return data.url || data.downloadUrl || dataUrl;
    } catch {
      return dataUrl;
    }
  }

  async function uploadAllBase64Images(html: string): Promise<string> {
    const regex = /<img\b[^>]*\ssrc=["'](data:image\/[^"']+)["'][^>]*>/gi;
    const urls = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null) urls.add(m[1]);
    if (urls.size === 0) return html;

    let out = html;
    let count = 0;
    for (const dataUrl of urls) {
      count++;
      setUploadProgress(`Uploading image ${count}/${urls.size}...`);
      const blobUrl = await uploadBase64Image(dataUrl);
      if (blobUrl !== dataUrl) {
        out = out.split(dataUrl).join(blobUrl);
      }
    }
    return out;
  }

  async function create() {
    if (!sections) return;
    setCreating(true);
    setError(null);
    setUploadProgress(null);
    try {
      let chaptersPayload = sections.map((s, i) => ({
        title: s.title,
        content: s.html,
        unitNumber: i + 1,
        type: s.type,
      }));

      // Step 1: Upload all base64 images to Blob storage
      const totalImages = chaptersPayload.reduce(
        (acc, ch) => acc + (ch.content.match(/data:image\//g) || []).length,
        0
      );
      let imagesUploaded = 0;
      if (totalImages > 0) {
        for (let i = 0; i < chaptersPayload.length; i++) {
          const ch = chaptersPayload[i];
          if (!/data:image\//.test(ch.content)) continue;
          setUploadProgress(`Uploading images: chapter ${i + 1}/${chaptersPayload.length}...`);
          chaptersPayload[i] = {
            ...ch,
            content: await uploadAllBase64Images(ch.content),
          };
          imagesUploaded++;
        }
        setUploadProgress(null);
      }

      // Step 2: Check final payload size
      const payloadSize = new Blob([JSON.stringify({ subjectId, replace, chapters: chaptersPayload })]).size;
      if (payloadSize > 4 * 1024 * 1024) {
        setError("Content abhi bhi bahut bada hai. Kam chapters try karein.");
        return;
      }

      // Step 3: Send chapters
      const res = await fetch("/api/admin/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          replace,
          chapters: chaptersPayload,
        }),
      });

      const text = await res.text();
      let d: Record<string, unknown>;
      try {
        d = JSON.parse(text);
      } catch {
        setError(`Server error (${res.status}): ${text.slice(0, 200)}`);
        return;
      }

      if (!res.ok) {
        setError((d.error as string) || "Chapters create nahi ho paye.");
        return;
      }
      setDone(sections.length);
      setSections(null);
      if (pasteRef.current) pasteRef.current.innerHTML = "";
      router.refresh();
    } catch {
      setError("Chapters create nahi ho paye. Network check karein.");
    } finally {
      setCreating(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="rounded-xl border p-5 bg-amber-50/40 space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-amber-600" />
        <h2 className="font-semibold">
          Bulk Import — puri Word document ek saath paste karein
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Apni puri Word chapter document (text + images) copy karein aur neeche
        paste (Ctrl+V) karein. Har <strong>Heading (Heading 1–4)</strong> par
        content alag Unit/Chapter mein split hoga. Har unit is subject ke
        neeche ek editable chapter ban jayega.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium">Default unit type:</label>
        <select
          value={defaultType}
          onChange={(e) => setDefaultType(e.target.value as "THEORY" | "PRACTICAL")}
          className="rounded-md border bg-background px-2 py-1 text-sm"
        >
          <option value="THEORY">Theory</option>
          <option value="PRACTICAL">Practical</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={replace}
            onChange={(e) => setReplace(e.target.checked)}
          />
          Is subject ke purane units replace karein
        </label>
      </div>

      <div
        ref={pasteRef}
        contentEditable
        suppressContentEditableWarning
        className="chapter-content min-h-[220px] p-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        data-placeholder="Yahan apni Word document paste karein (Ctrl+V)…"
      />

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={preview} disabled={creating || !sections}>
          Split &amp; Preview
        </Button>
        {sections && (
          <Button onClick={create} disabled={creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Create {sections.length} Chapters
          </Button>
        )}
        {done !== null && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> {done} chapters create ho gaye.
          </span>
        )}
      </div>
      {uploadProgress && (
        <p className="text-sm text-blue-600 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {uploadProgress}
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {sections && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Preview ({sections.length} units):</p>
          {sections.map((s, i) => (
            <div key={i} className="rounded-md border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">
                  {i + 1}. {s.title}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    s.type === "PRACTICAL"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {s.type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {s.preview}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
