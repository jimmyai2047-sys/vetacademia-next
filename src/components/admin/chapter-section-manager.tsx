"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Pencil,
  Loader2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChapterRichEditor from "@/components/admin/chapter-rich-editor";

type Section = {
  id: string;
  title: string;
  content: string;
  order: number;
};

export default function ChapterSectionManager({
  chapterId,
  initialSections,
}: {
  chapterId: string;
  initialSections: Section[];
}) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd() {
    setAdding(true);
    setError(null);
    try {
      const title = newTitle.trim() || "New Section";
      const res = await fetch("/api/admin/chapter-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, title, order: sections.length }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Add failed");
        return;
      }
      setSections((prev) => [...prev, data]);
      setNewTitle("");
      setEditingId(data.id);
    } catch {
      setError("Add failed");
    } finally {
      setAdding(false);
    }
  }

  async function saveTitle(id: string, title: string) {
    const t = title.trim();
    if (!t) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/chapter-sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Save failed");
        return;
      }
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: t } : s))
      );
    } catch {
      setError("Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function saveContent(id: string, html: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/chapter-sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: html }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Save failed");
        return;
      }
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, content: html } : s))
      );
    } catch {
      setError("Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const ao = a.order;
    const bo = b.order;
    setBusyId(id);
    try {
      await Promise.all([
        fetch(`/api/admin/chapter-sections/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: bo }),
        }),
        fetch(`/api/admin/chapter-sections/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: ao }),
        }),
      ]);
      const newSorted = [...sorted];
      newSorted[idx] = { ...a, order: bo };
      newSorted[swapIdx] = { ...b, order: ao };
      setSections(newSorted.sort((x, y) => x.order - y.order));
    } catch {
      setError("Reorder failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this section?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/chapter-sections/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Delete failed");
        return;
      }
      setSections((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) setEditingId(null);
    } catch {
      setError("Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteLegacy() {
    if (
      !confirm(
        "Delete the OLD chapter content? Sections will be used instead. This cannot be undone."
      )
    )
      return;
    setBusyId("legacy");
    try {
      const res = await fetch(`/api/admin/chapter/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed");
        return;
      }
    } catch {
      setError("Failed");
    } finally {
      setBusyId(null);
    }
  }

  const ordered = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-lg border p-3 bg-card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" /> Sections ({sections.length})
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New section title"
          className="h-8 text-xs flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button size="sm" onClick={handleAdd} disabled={adding}>
          {adding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {ordered.map((s, i) => (
          <div key={s.id} className="rounded-md border bg-muted/30">
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <span className="text-xs font-mono text-muted-foreground w-5 text-center">
                {i + 1}
              </span>
              <input
                defaultValue={s.title}
                onBlur={(e) => saveTitle(s.id, e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-sm font-medium focus:outline-none"
              />
              <button
                onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                className="shrink-0 p-1 text-muted-foreground hover:text-primary"
                aria-label="Edit content"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => move(s.id, -1)}
                disabled={i === 0 || busyId !== null}
                className="shrink-0 p-1 disabled:opacity-40 hover:text-primary"
                aria-label="Move up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => move(s.id, 1)}
                disabled={i === ordered.length - 1 || busyId !== null}
                className="shrink-0 p-1 disabled:opacity-40 hover:text-primary"
                aria-label="Move down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => remove(s.id)}
                disabled={busyId === s.id}
                className="shrink-0 p-1 text-muted-foreground hover:text-red-500"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {editingId === s.id && (
              <div className="px-2 pb-2 pt-1 border-t">
                <p className="text-xs text-muted-foreground mb-1">
                  Section Content
                </p>
                <ChapterRichEditor
                  chapterId={chapterId}
                  key={s.id}
                  initialContent={s.content}
                  onSave={(html) => saveContent(s.id, html)}
                  saveLabel="Save Section"
                />
              </div>
            )}
          </div>
        ))}
        {sections.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No sections yet. Add one above.
          </p>
        )}
      </div>

      <div className="pt-1 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-600"
          onClick={deleteLegacy}
          disabled={busyId === "legacy"}
        >
          {busyId === "legacy" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <Trash2 className="h-3.5 w-3.5 mr-1" />
          )}
          Delete legacy chapter content
        </Button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
