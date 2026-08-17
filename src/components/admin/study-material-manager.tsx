"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X, Upload, Loader2, FileText, GraduationCap } from "lucide-react";
import RichTextEditor from "@/components/admin/rich-text-editor";
import { importDocxAsHtml } from "@/lib/docx-import";

type SubjectOption = { id: string; name: string; programme: string | null };

type StudyMaterialRow = {
  id: string;
  title: string;
  type: string;
  content: string | null;
  url: string | null;
  fileName: string | null;
  fileType: string | null;
  subjectId: string | null;
  isDemo: boolean;
  isPublic: boolean;
  subject?: { name: string; programme?: { name: string | null } } | null;
};

const TYPES = ["NOTE", "PDF", "DOC", "XLS", "PPT", "VIDEO", "LINK", "IMAGE"];
const FILE_TYPES_SM = ["PDF", "DOC", "XLS", "PPT", "IMAGE"];

export default function StudyMaterialManager() {
  const [rows, setRows] = useState<StudyMaterialRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("NOTE");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [file, setFile] = useState<{
    url: string;
    fileName: string;
    fileType: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const docxRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const [m, s] = await Promise.all([
        fetch("/api/admin/study-materials").then((r) => r.json()),
        fetch("/api/admin/subjects").then((r) => r.json()),
      ]);
      setRows(m);
      setSubjects(s);
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
    setEditingId(null);
    setTitle("");
    setType("NOTE");
    setContent("");
    setUrl("");
    setFileName("");
    setFileType("");
    setFile(null);
    setSubjectId("");
    setIsDemo(false);
    setIsPublic(true);
    setError(null);
    setShowForm(true);
  }

  function openEdit(m: StudyMaterialRow) {
    setEditingId(m.id);
    setTitle(m.title);
    setType(m.type);
    setContent(m.content || "");
    setUrl(m.url || "");
    setFileName(m.fileName || "");
    setFileType(m.fileType || "");
    setFile(
      m.url
        ? { url: m.url, fileName: m.fileName || "", fileType: m.fileType || "" }
        : null
    );
    setSubjectId(m.subjectId || "");
    setIsDemo(m.isDemo);
    setIsPublic(m.isPublic);
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
      setUrl(data.url);
      setFileName(data.fileName);
      setFileType(data.fileType);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDocxImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImporting(true);
    setError(null);
    try {
      const html = await importDocxAsHtml(f);
      setContent(html);
    } catch (err: any) {
      setError(err?.message || "Word file conversion failed");
    } finally {
      setImporting(false);
      if (docxRef.current) docxRef.current.value = "";
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
        type,
        content: content || null,
        url: url || null,
        fileName: fileName || null,
        fileType: fileType || null,
        subjectId: subjectId || null,
        isDemo,
        isPublic,
      };
      const res = editingId
        ? await fetch(`/api/admin/study-materials/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/study-materials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Save failed");
        return;
      }
      setShowForm(false);
      await load();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this study material?")) return;
    const res = await fetch(`/api/admin/study-materials/${id}`, {
      method: "DELETE",
    });
    if (res.ok) load();
  }

  const subjectName = (id: string | null) =>
    subjects.find((s) => s.id === id)?.name || "—";
  const programmeFor = (m: StudyMaterialRow) =>
    m.subject?.programme?.name ?? (subjectId && m.subjectId ? subjectName(m.subjectId) : null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Add UG/PG study notes and resources. Tick &quot;Demo&quot; to show them
          free on the /demo page.
        </p>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> New Material
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {editingId ? "Edit" : "New"} Study Material
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium block">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium block">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium block">Subject (programme)</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— None —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.programme ? ` (${s.programme})` : ""}
                  </option>
                ))}
              </select>
            </div>
            {type === "LINK" || type === "VIDEO" ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium block">URL</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
            ) : null}
          </div>

          {type === "NOTE" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium block">
                  Content (paste chapter from Word — formatting is kept &amp; cleaned)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={docxRef}
                    type="file"
                    accept=".doc,.docx"
                    className="hidden"
                    onChange={handleDocxImport}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => docxRef.current?.click()}
                    disabled={importing}
                  >
                    {importing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Import from Word (.docx)
                  </Button>
                </div>
              </div>
              <RichTextEditor value={content} onChange={setContent} />
            </div>
          ) : FILE_TYPES_SM.includes(type) ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium block">
                Upload File ({type})
              </label>
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
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setUrl("");
                        setFileName("");
                        setFileType("");
                      }}
                      className="text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Or paste an external URL instead:
              </p>
              <Input
                className="mt-1"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          ) : null}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sm-isDemo"
                checked={isDemo}
                onChange={(e) => setIsDemo(e.target.checked)}
              />
              <label htmlFor="sm-isDemo" className="text-sm">
                Demo content (free for everyone)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sm-isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <label htmlFor="sm-isPublic" className="text-sm">
                Public
              </label>
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No study materials yet.</p>
      ) : (
        <div className="space-y-6">
          {(() => {
            const map = new Map<string, StudyMaterialRow[]>();
            for (const m of rows) {
              const key = m.subject?.programme?.name || "Uncategorized";
              if (!map.has(key)) map.set(key, []);
              map.get(key)!.push(m);
            }
            const entries = Array.from(map.entries()).sort((a, b) =>
              a[0].localeCompare(b[0])
            );
            return entries.map(([programme, items]) => (
              <div
                key={programme}
                className="rounded-xl border bg-card overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{programme}</h3>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-3">Title</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3">Subject</th>
                        <th className="text-left p-3">Demo</th>
                        <th className="text-left p-3">Public</th>
                        <th className="text-right p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((m) => (
                        <tr key={m.id} className="border-t">
                          <td className="p-3">{m.title}</td>
                          <td className="p-3">{m.type}</td>
                          <td className="p-3">{m.subject?.name || "—"}</td>
                          <td className="p-3">
                            {m.isDemo ? (
                              <Badge
                                variant="outline"
                                className="text-emerald-600 border-emerald-600"
                              >
                                Demo
                              </Badge>
                            ) : (
                              "No"
                            )}
                          </td>
                          <td className="p-3">{m.isPublic ? "Yes" : "No"}</td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <button
                              className="text-primary hover:underline mr-3"
                              onClick={() => openEdit(m)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:underline"
                              onClick={() => handleDelete(m.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
