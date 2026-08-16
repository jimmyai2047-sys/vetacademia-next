"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TRACK_OPTIONS, trackLabel } from "@/lib/exam-tracks";
import {
  Pencil,
  Trash2,
  Plus,
  Upload,
  Loader2,
  FileText,
  X,
} from "lucide-react";

type Post = {
  id: string;
  category: string;
  title: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  exam: string | null;
  track: string | null;
  published: boolean;
  createdAt: string;
};

const CATEGORIES = [
  { key: "ANIMAL_OWNER", label: "Animal Owners" },
  { key: "VETS", label: "Vets" },
  { key: "ADVISORY", label: "Advisory" },
  { key: "PREVIOUS_YEAR", label: "Previous Year Papers" },
];

const EXAMS = [
  { key: "psc", label: "PSC" },
  { key: "icar-entrance", label: "ICAR" },
  { key: "net", label: "NET" },
  { key: "ars", label: "ARS" },
  { key: "other", label: "Other" },
];

export default function PostManager() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("ANIMAL_OWNER");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [exam, setExam] = useState("");
  const [track, setTrack] = useState("");
  const [published, setPublished] = useState(true);
  const [file, setFile] = useState<{
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number | null;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/posts");
      const data = await res.json();
      setPosts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function openNew() {
    setEditing(null);
    setTitle("");
    setContent("");
    setExam("");
    setTrack("");
    setPublished(true);
    setFile(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(p: Post) {
    setEditing(p);
    setTitle(p.title);
    setContent(p.content || "");
    setExam(p.exam || "");
    setTrack(p.track || "");
    setPublished(p.published);
    setFile(
      p.fileUrl
        ? {
            url: p.fileUrl,
            fileName: p.fileName || "",
            fileType: p.fileType || "",
            fileSize: p.fileSize,
          }
        : null
    );
    setError(null);
    setShowForm(true);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setFile({
        url: data.url,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
      });
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        category: activeCategory,
        content,
        exam: activeCategory === "PREVIOUS_YEAR" ? exam || null : null,
        track: activeCategory === "PREVIOUS_YEAR" ? track || null : null,
        published,
        file,
      };
      const res = editing
        ? await fetch(`/api/admin/posts/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Save failed");
        return;
      }
      setShowForm(false);
      await loadPosts();
      router.refresh();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Post) {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/admin/posts/${p.id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((x) => x.id !== p.id));
        router.refresh();
      }
    } catch {
      // ignore
    }
  }

  const filtered = posts.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setActiveCategory(c.key);
              setShowForm(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              activeCategory === c.key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input hover:bg-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
        <Button size="sm" className="ml-auto" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> New Post
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {editing ? "Edit" : "New"} Post &middot;{" "}
              {CATEGORIES.find((c) => c.key === activeCategory)?.label}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
          </div>

          {activeCategory === "PREVIOUS_YEAR" && (
            <div className="space-y-1.5">
              <Label>Exam</Label>
              <select
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select exam</option>
                {EXAMS.map((ex) => (
                  <option key={ex.key} value={ex.key}>
                    {ex.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeCategory === "PREVIOUS_YEAR" && (
            <div className="space-y-1.5">
              <Label>Track (optional — separate VO/VS, LSA, ICAR Pre/Mains)</Label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {TRACK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Content (rich text + images)</Label>
            <RichTextEditor value={content} onChange={setContent} />
          </div>

          <div className="space-y-1.5">
            <Label>Attachment (optional file)</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={handleFile}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Upload File
              </Button>
              {file && (
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  {file.fileName}
                  <button onClick={() => setFile(null)} className="text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Published (visible on site)
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : editing ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts yet.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{p.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  {!p.published && (
                    <Badge variant="secondary" className="text-xs">
                      Draft
                    </Badge>
                  )}
                  {p.content && (
                    <Badge variant="outline" className="text-xs">
                      Article
                    </Badge>
                  )}
                  {p.fileUrl && (
                    <Badge variant="outline" className="text-xs">
                      {p.fileType} File
                    </Badge>
                  )}
                  {p.exam && (
                    <Badge variant="outline" className="text-xs">
                      {EXAMS.find((e) => e.key === p.exam)?.label}
                    </Badge>
                  )}
                  {p.track && (
                    <Badge variant="secondary" className="text-xs">
                      {trackLabel(p.track)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(p)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
