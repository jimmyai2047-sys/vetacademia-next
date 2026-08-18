"use client";

import { useState } from "react";
import { Upload, Trash2, FileText, Presentation, Video, Image as ImageIcon, Archive, File as FileIcon, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type ContentItem = {
  id: string;
  title: string;
  fileType: string;
  fileName: string;
  url: string;
  downloadUrl?: string;
  size: number | null;
};

function iconFor(type: string) {
  switch (type) {
    case "PDF":
    case "DOC":
    case "XLS":
      return FileText;
    case "PPT":
      return Presentation;
    case "VIDEO":
      return Video;
    case "IMAGE":
      return ImageIcon;
    case "ZIP":
      return Archive;
    default:
      return FileIcon;
  }
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChapterContentManager({
  chapterId,
  chapterTitle,
  initialContents,
}: {
  chapterId: string;
  chapterTitle: string;
  initialContents: ContentItem[];
}) {
  const [contents, setContents] = useState<ContentItem[]>(initialContents);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) {
      setError("Please choose a file");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("chapterId", chapterId);
      fd.append("title", title.trim() || file.name);
      fd.append("file", file);

      const res = await fetch("/api/admin/content", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setContents((prev) => [data as ContentItem, ...prev]);
      setFile(null);
      setTitle("");
      const input = document.getElementById(
        `file-${chapterId}`
      ) as HTMLInputElement | null;
      if (input) input.value = "";
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this file?")) return;
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Delete failed");
        return;
      }
      setContents((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Delete failed");
    }
  }

  return (
    <div className="rounded-lg border p-3 bg-card">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-medium truncate">{chapterTitle}</span>
        <Badge variant="outline" className="shrink-0">
          {contents.length} file{contents.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {contents.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {contents.map((c) => {
            const Icon = iconFor(c.fileType);
            return (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={c.downloadUrl || c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-0 truncate text-xs hover:underline"
                  title={c.fileName}
                >
                  {c.title}
                </a>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatSize(c.size)}
                </span>
                <a href={c.downloadUrl || c.url} target="_blank" rel="noreferrer" className="shrink-0">
                  <Download className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                </a>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="shrink-0"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          id={`file-${chapterId}`}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <label
          htmlFor={`file-${chapterId}`}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-8 text-xs cursor-pointer hover:bg-muted"
        >
          Choose
        </label>
        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
          {file ? file.name : "No file"}
        </span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="h-8 text-xs flex-1"
        />
        <Button size="sm" onClick={handleUpload} disabled={uploading || !file}>
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Upload
        </Button>
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
