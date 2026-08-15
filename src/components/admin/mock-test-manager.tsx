"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TRACK_OPTIONS, examForTrack, trackLabel } from "@/lib/exam-tracks";
import {
  Plus,
  Trash2,
  Pencil,
  Upload,
  Loader2,
  FileText,
  X,
  ArrowRight,
} from "lucide-react";

type MockTest = {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  totalMarks: number;
  fileName: string | null;
  fileType: string | null;
  exam?: string | null;
  track?: string | null;
  isAdaptive?: boolean;
  _count?: { questions: number };
};

export default function MockTestManager() {
  const router = useRouter();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MockTest | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [totalMarks, setTotalMarks] = useState(0);
  const [track, setTrack] = useState("");
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [file, setFile] = useState<{
    url: string;
    fileName: string;
    fileType: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mock-tests");
      const data = await res.json();
      setTests(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setDuration(30);
    setTotalMarks(0);
    setTrack("");
    setIsAdaptive(false);
    setFile(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(t: MockTest) {
    setEditing(t);
    setTitle(t.title);
    setDescription(t.description || "");
    setDuration(t.duration);
    setTotalMarks(t.totalMarks);
    setTrack(t.track || "");
    setIsAdaptive(t.isAdaptive || false);
    setFile(
      t.fileName
        ? { url: "", fileName: t.fileName, fileType: t.fileType || "" }
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
      setFile({ url: data.url, fileName: data.fileName, fileType: data.fileType });
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
        description,
        duration,
        totalMarks,
        track: track || null,
        exam: examForTrack(track),
        isAdaptive,
        file,
      };
      const res = editing
        ? await fetch(`/api/admin/mock-tests/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/mock-tests", {
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
      await load();
      router.refresh();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: MockTest) {
    if (!confirm("Delete this test and its questions?")) return;
    try {
      const res = await fetch(`/api/admin/mock-tests/${t.id}`, { method: "DELETE" });
      if (res.ok) {
        setTests((prev) => prev.filter((x) => x.id !== t.id));
        router.refresh();
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Create online quizzes (questions + auto-check) and attach practice-set PDFs.
        </p>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> New Test
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "Edit" : "New"} Test</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Total Marks</Label>
            <Input
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Track (tag to VO/VS, LSA, ICAR Pre/Mains, etc.)</Label>
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
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAdaptive"
              checked={isAdaptive}
              onChange={(e) => setIsAdaptive(e.target.checked)}
            />
            <label htmlFor="isAdaptive" className="text-sm">
              Adaptive Test (vs standard Mock Test)
            </label>
          </div>
          <div className="space-y-1.5">
            <Label>Practice Set File (optional PDF)</Label>
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
      ) : tests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tests yet.</p>
      ) : (
        <div className="space-y-2">
          {tests.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{t.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {t._count?.questions ?? 0} Qs
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {t.duration} min
                  </Badge>
                  {t.fileName && (
                    <Badge variant="outline" className="text-xs">
                      {t.fileType} Set
                    </Badge>
                  )}
                  {t.track && (
                    <Badge variant="secondary" className="text-xs">
                      {trackLabel(t.track)}
                    </Badge>
                  )}
                  {t.isAdaptive && (
                    <Badge variant="default" className="text-xs">
                      Adaptive
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/mock-tests/${t.id}`)}
                >
                  Questions <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(t)}>
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
