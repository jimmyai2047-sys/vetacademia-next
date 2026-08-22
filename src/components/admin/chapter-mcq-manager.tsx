"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Pencil,
  Loader2,
  ListChecks,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mcq = {
  id: string;
  question: string;
  options: string[] | string;
  correctIndex: number;
  marks: number;
  explanation: string | null;
  difficulty: number | null;
  order: number;
};

function normOpts(o: string[] | string): string[] {
  if (Array.isArray(o)) return o;
  try {
    const p = JSON.parse(o);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function emptyForm(): {
  question: string;
  options: string[];
  correctIndex: number;
  marks: number;
  explanation: string;
  difficulty: number;
} {
  return {
    question: "",
    options: ["", ""],
    correctIndex: 0,
    marks: 1,
    explanation: "",
    difficulty: 2,
  };
}

export default function ChapterMcqManager({
  chapterId,
  initialMcqs,
}: {
  chapterId: string;
  initialMcqs: Mcq[];
}) {
  const [mcqs, setMcqs] = useState<Mcq[]>(
    initialMcqs.map((m) => ({ ...m, options: normOpts(m.options) }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [bulkText, setBulkText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  function openNew() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
    setShowBulk(false);
    setError(null);
  }

  function openEdit(m: Mcq) {
    setForm({
      question: m.question,
      options: [...normOpts(m.options)],
      correctIndex: m.correctIndex,
      marks: m.marks,
      explanation: m.explanation || "",
      difficulty: m.difficulty ?? 2,
    });
    setEditingId(m.id);
    setShowForm(true);
    setShowBulk(false);
    setError(null);
  }

  function setOpt(i: number, val: string) {
    setForm((f) => {
      const opts = [...f.options];
      opts[i] = val;
      return { ...f, options: opts };
    });
  }
  function addOpt() {
    setForm((f) => ({ ...f, options: [...f.options, ""] }));
  }
  function removeOpt(i: number) {
    setForm((f) => {
      const opts = f.options.filter((_, idx) => idx !== i);
      return {
        ...f,
        options: opts,
        correctIndex: f.correctIndex >= opts.length ? 0 : f.correctIndex,
      };
    });
  }

  async function save() {
    setError(null);
    const q = form.question.trim();
    const opts = form.options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!q) {
      setError("Question required.");
      return;
    }
    if (opts.length < 2) {
      setError("At least 2 options required.");
      return;
    }
    if (form.correctIndex < 0 || form.correctIndex >= opts.length) {
      setError("Select the correct answer.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        chapterId,
        question: q,
        options: opts,
        correctIndex: form.correctIndex,
        marks: form.marks,
        explanation: form.explanation.trim() || null,
        difficulty: form.difficulty,
      };
      if (editingId) {
        const res = await fetch(`/api/admin/chapter-mcqs/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          setError((await res.json()).error || "Save failed");
          setSaving(false);
          return;
        }
        const d = await res.json();
        setMcqs((prev) =>
          prev.map((m) => (m.id === editingId ? { ...m, ...d } : m))
        );
      } else {
        const res = await fetch("/api/admin/chapter-mcqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          setError((await res.json()).error || "Save failed");
          setSaving(false);
          return;
        }
        const d = await res.json();
        setMcqs((prev) => [...prev, d]);
      }
      setShowForm(false);
      setEditingId(null);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this MCQ?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/chapter-mcqs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError((await res.json()).error || "Delete failed");
        return;
      }
      setMcqs((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError("Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const sorted = [...mcqs].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((m) => m.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swap];
    setBusyId(id);
    try {
      await Promise.all([
        fetch(`/api/admin/chapter-mcqs/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: b.order }),
        }),
        fetch(`/api/admin/chapter-mcqs/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: a.order }),
        }),
      ]);
      const ns = [...sorted];
      ns[idx] = { ...a, order: b.order };
      ns[swap] = { ...b, order: a.order };
      setMcqs(ns.sort((x, y) => x.order - y.order));
    } catch {
      setError("Reorder failed");
    } finally {
      setBusyId(null);
    }
  }

  async function bulkImport() {
    setError(null);
    let arr: any[];
    try {
      arr = JSON.parse(bulkText);
      if (!Array.isArray(arr)) throw new Error("JSON array expected");
    } catch (e: any) {
      setError("Invalid JSON. Expected an array of MCQ objects.");
      return;
    }
    setBulkBusy(true);
    let ok = 0;
    try {
      for (const item of arr) {
        const opts = Array.isArray(item.options)
          ? item.options.map((o: any) => String(o).trim()).filter(Boolean)
          : [];
        if (!item.question || opts.length < 2) continue;
        const res = await fetch("/api/admin/chapter-mcqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId,
            question: String(item.question).trim(),
            options: opts,
            correctIndex: Number(item.correctIndex),
            marks: Number(item.marks) || 1,
            explanation: item.explanation ? String(item.explanation) : null,
            difficulty: Number(item.difficulty) || 2,
          }),
        });
        if (res.ok) ok++;
      }
      // Refresh list from server
      const list = await fetch(`/api/admin/chapter-mcqs?chapterId=${chapterId}`);
      if (list.ok) setMcqs(await list.json());
      setBulkText("");
      setShowBulk(false);
    } catch {
      setError("Bulk import failed");
    } finally {
      setBulkBusy(false);
      if (ok > 0) setError(null);
    }
  }

  const ordered = [...mcqs].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-lg border p-3 bg-card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" /> MCQs ({mcqs.length})
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowBulk((v) => !v); setShowForm(false); }}>
            <FileUp className="h-3.5 w-3.5 mr-1" /> Bulk
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>

      {showBulk && (
        <div className="rounded-md border bg-muted/30 p-2 space-y-2">
          <p className="text-xs text-muted-foreground">
            Paste a JSON array of MCQ objects. Format shown in the placeholder
            below — each item needs question, options (array) and correctIndex
            (0-based).
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            className="w-full rounded-md border bg-background p-2 text-xs font-mono"
            placeholder='[{"question":"...","options":["A","B"],"correctIndex":0}]'
          />
          <Button size="sm" onClick={bulkImport} disabled={bulkBusy}>
            {bulkBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Import
          </Button>
        </div>
      )}

      {showForm && (
        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
          <textarea
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            rows={2}
            placeholder="Question"
            className="w-full rounded-md border bg-background p-2 text-sm"
          />
          <div className="space-y-1.5">
            {form.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${editingId ?? "new"}`}
                  checked={form.correctIndex === i}
                  onChange={() => setForm((f) => ({ ...f, correctIndex: i }))}
                  className="accent-primary"
                />
                <Input
                  value={o}
                  onChange={(e) => setOpt(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="h-8 text-sm flex-1"
                />
                {form.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOpt(i)}
                    className="text-muted-foreground hover:text-red-500"
                    aria-label="Remove option"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={addOpt} className="text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add option
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Marks</label>
            <Input
              type="number"
              min={1}
              value={form.marks}
              onChange={(e) =>
                setForm((f) => ({ ...f, marks: Number(e.target.value) || 1 }))
              }
              className="h-8 w-16 text-sm"
            />
            <label className="text-xs text-muted-foreground">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) =>
                setForm((f) => ({ ...f, difficulty: Number(e.target.value) }))
              }
              className="h-8 rounded-md border bg-background px-2 text-sm"
            >
              <option value={1}>Easy</option>
              <option value={2}>Medium</option>
              <option value={3}>Hard</option>
            </select>
          </div>
          <textarea
            value={form.explanation}
            onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
            rows={2}
            placeholder="Explanation (optional)"
            className="w-full rounded-md border bg-background p-2 text-sm"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              {editingId ? "Update" : "Save"} MCQ
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowForm(false); setEditingId(null); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {ordered.map((m, i) => (
          <div key={m.id} className="rounded-md border bg-muted/30 p-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-mono text-muted-foreground w-5 text-center mt-0.5">
                {i + 1}
              </span>
              <p className="flex-1 text-sm font-medium">{m.question}</p>
              <button
                onClick={() => openEdit(m)}
                className="shrink-0 p-1 text-muted-foreground hover:text-primary"
                aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => move(m.id, -1)}
                disabled={i === 0 || busyId !== null}
                className="shrink-0 p-1 disabled:opacity-40 hover:text-primary"
                aria-label="Move up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => move(m.id, 1)}
                disabled={i === ordered.length - 1 || busyId !== null}
                className="shrink-0 p-1 disabled:opacity-40 hover:text-primary"
                aria-label="Move down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => remove(m.id)}
                disabled={busyId === m.id}
                className="shrink-0 p-1 text-muted-foreground hover:text-red-500"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="ml-7 mt-1 space-y-0.5 text-xs text-muted-foreground">
              {normOpts(m.options).map((o, oi) => (
                <li key={oi} className={oi === m.correctIndex ? "font-semibold text-emerald-600" : ""}>
                  {oi === m.correctIndex ? "✓ " : "• "}
                  {o}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {mcqs.length === 0 && (
          <p className="text-xs text-muted-foreground">No MCQs yet. Add or bulk-import.</p>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
