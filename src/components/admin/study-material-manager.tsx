"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X } from "lucide-react";

type SubjectOption = { id: string; name: string; programme: string | null };

type StudyMaterialRow = {
  id: string;
  title: string;
  type: string;
  content: string | null;
  url: string | null;
  subjectId: string | null;
  isDemo: boolean;
  isPublic: boolean;
  subject?: { programme?: { name: string | null } } | null;
};

const TYPES = ["NOTE", "PDF", "VIDEO", "LINK", "IMAGE"];

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
  const [subjectId, setSubjectId] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setSubjectId(m.subjectId || "");
    setIsDemo(m.isDemo);
    setIsPublic(m.isPublic);
    setError(null);
    setShowForm(true);
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium block">
                URL (for PDF/VIDEO/LINK)
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://… (optional)"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium block">Content (NOTE)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Study note text (optional)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
            />
          </div>
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
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Programme</th>
                <th className="text-left p-3">Demo</th>
                <th className="text-left p-3">Public</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3">{m.title}</td>
                  <td className="p-3">{m.type}</td>
                  <td className="p-3">{programmeFor(m) || "—"}</td>
                  <td className="p-3">
                    {m.isDemo ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-600">
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
      )}
    </div>
  );
}
