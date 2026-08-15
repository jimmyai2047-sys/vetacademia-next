"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EXAM_PREP_CATEGORIES,
  MATERIAL_TYPES,
  FILE_TYPES,
  LINK_TYPES,
  materialTypeLabel,
  getExamPrepCategory,
} from "@/lib/exam-prep";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  FileText,
  X,
} from "lucide-react";

type MaterialRow = {
  id: string;
  category: string;
  type: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  externalUrl: string | null;
  published: boolean;
  order: number;
};

type FormState = {
  category: string;
  type: string;
  title: string;
  description: string;
  externalUrl: string;
  published: boolean;
  order: number;
};

const emptyForm: FormState = {
  category: "VO",
  type: "PDF",
  title: "",
  description: "",
  externalUrl: "",
  published: true,
  order: 0,
};

export default function ExamMaterialManager({
  category,
  showHeading = true,
}: {
  category?: string;
  showHeading?: boolean;
}) {
  const [rows, setRows] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>({
    ...emptyForm,
    category: category || emptyForm.category,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
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

  async function load() {
    setLoading(true);
    const url = category
      ? `/api/admin/exam-materials?category=${encodeURIComponent(category)}`
      : "/api/admin/exam-materials";
    const res = await fetch(url);
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(m: MaterialRow) {
    setEditingId(m.id);
    setForm({
      category: m.category,
      type: m.type,
      title: m.title,
      description: m.description || "",
      externalUrl: m.externalUrl || "",
      published: m.published,
      order: m.order,
    });
    setFile(
      m.fileUrl
        ? {
            url: m.fileUrl,
            fileName: m.fileName || "",
            fileType: m.fileType || "",
            fileSize: null,
          }
        : null
    );
    setError(null);
  }

  function reset() {
    setEditingId(null);
    setForm({ ...emptyForm, category: category || emptyForm.category });
    setFile(null);
    setError(null);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (
      LINK_TYPES.includes(form.type as any) &&
      !form.externalUrl.trim() &&
      !file
    ) {
      setError("Add an external URL for video/audio materials.");
      return;
    }
    if (
      FILE_TYPES.includes(form.type as any) &&
      !file &&
      !form.externalUrl.trim()
    ) {
      setError("Upload a file for this material type.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      description: form.description || null,
      externalUrl: form.externalUrl || null,
      fileUrl: file?.url || null,
      fileName: file?.fileName || null,
      fileType: file?.fileType || null,
      fileSize: file?.fileSize ?? null,
    };
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `/api/admin/exam-materials/${editingId}`
      : "/api/admin/exam-materials";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      reset();
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Save failed.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this material?")) return;
    const res = await fetch(`/api/admin/exam-materials/${id}`, {
      method: "DELETE",
    });
    if (res.ok) load();
  }

  const categoryLabel = (c: string) =>
    EXAM_PREP_CATEGORIES.find((x) => x.key === c)?.label || c;

  return (
    <div className="space-y-8">
      {showHeading && (
        <div>
          <h1 className="text-2xl font-bold">Exam Study Materials</h1>
          <p className="text-muted-foreground">
            Upload PPT/PDF/Video/Audio/Animation/Image resources for exam-prep
            students, organised by category (VO, LSA, ARS, ICAR Entrance).
          </p>
        </div>
      )}

      <section className="rounded-xl border p-5 bg-card">
        <h2 className="font-semibold mb-4">
          {editingId ? "Edit Material" : "Add Material"}
        </h2>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          {category ? (
            <div>
              <label className="text-sm font-medium block mb-1">Category</label>
              <div className="w-full rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {getExamPrepCategory(category)?.label || category}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium block mb-1">Category</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                {EXAM_PREP_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium block mb-1">Type</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {MATERIAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">Title</label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g. Veterinary Anatomy - Full PPT"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Short description"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
            />
          </div>

          {LINK_TYPES.includes(form.type as any) ? (
            <div className="sm:col-span-2">
              <label className="text-sm font-medium block mb-1">
                External URL (YouTube / audio link)
              </label>
              <Input
                value={form.externalUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, externalUrl: e.target.value }))
                }
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          ) : (
            <div className="sm:col-span-2">
              <label className="text-sm font-medium block mb-1">
                Upload File ({form.type})
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
                      onClick={() => setFile(null)}
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
                value={form.externalUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, externalUrl: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1">
              Display Order
            </label>
            <Input
              type="number"
              value={form.order}
              onChange={(e) =>
                setForm((f) => ({ ...f, order: Number(e.target.value) }))
              }
            />
          </div>
          <div className="flex items-end gap-2">
            <input
              type="checkbox"
              id="published"
              checked={form.published}
              onChange={(e) =>
                setForm((f) => ({ ...f, published: e.target.checked }))
              }
            />
            <label htmlFor="published" className="text-sm">
              Published (visible on site)
            </label>
          </div>

          <div className="sm:col-span-2 flex items-center gap-2 sm:justify-end">
            {editingId && (
              <Button type="button" variant="outline" onClick={reset}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Add Material"}
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </section>

      <section>
        <h2 className="font-semibold mb-3">Existing Materials</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No materials yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Source</th>
                  <th className="text-left p-3">Published</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-3">{categoryLabel(m.category)}</td>
                    <td className="p-3">{materialTypeLabel(m.type)}</td>
                    <td className="p-3">{m.title}</td>
                    <td className="p-3 max-w-[200px] truncate">
                      {m.externalUrl
                        ? "Link"
                        : m.fileName || (m.fileUrl ? "File" : "—")}
                    </td>
                    <td className="p-3">{m.published ? "Yes" : "No"}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        className="text-primary hover:underline mr-3"
                        onClick={() => startEdit(m)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => remove(m.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
