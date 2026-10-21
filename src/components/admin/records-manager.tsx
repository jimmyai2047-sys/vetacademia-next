"use client";

import { useEffect, useState } from "react";
import { csrfFetch } from "@/lib/csrf-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import { Loader2, Plus, Pencil, Trash2, RotateCcw, Star } from "lucide-react";
import type { Collection, FieldDef } from "./content-collections";

type Item = Record<string, string | number | boolean | null> & { id: string };
type FormValues = Record<string, string | number | boolean>;

function displayValue(item: Item, key: string, type?: string) {
  const v = item[key];
  if (v === null || v === undefined || v === "") return "—";
  if (type === "bool") return v === true ? "Yes" : "No";
  if (type === "date") {
    try {
      return new Date(String(v)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return String(v);
    }
  }
  if (type === "rating") return Number(v).toFixed(1);
  return String(v);
}

// Generic admin CRUD for content collections that previously had no admin UI
// (finding 17: blog / books / success stories). Every mutation goes through
// csrfFetch and is audit-logged server-side.
export default function RecordsManager({ collection }: { collection: Collection }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const res = await fetch(collection.endpoint);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d.error as string) || `Failed to load ${collection.itemNoun}s`);
        return;
      }
      const d = await res.json();
      setItems(d as Item[]);
    } catch {
      setError(`Failed to load ${collection.itemNoun}s`);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(collection.endpoint);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          if (alive) setError((d.error as string) || `Failed to load ${collection.itemNoun}s`);
          return;
        }
        const d = await res.json();
        if (alive) setItems(d as Item[]);
      } catch {
        if (alive) setError(`Failed to load ${collection.itemNoun}s`);
      }
    })();
    return () => { alive = false; };
  }, [collection.endpoint, collection.itemNoun]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...collection.defaults });
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(item: Item) {
    setEditingId(item.id);
    const next: FormValues = {};
    for (const f of collection.fields) {
      const raw = item[f.key];
      const fallback = collection.defaults[f.key];
      if (typeof fallback === "boolean") {
        next[f.key] = raw === true || raw === "true";
      } else if (typeof fallback === "number") {
        next[f.key] = raw === null || raw === "" || raw === undefined ? (f.key === "rating" ? 5 : 0) : Number(raw);
      } else {
        next[f.key] = raw === null || raw === undefined ? "" : String(raw);
      }
    }
    setForm(next);
    setError(null);
    setDialogOpen(true);
  }

  function setField(key: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    for (const f of collection.fields) {
      if (f.required && String(form[f.key] ?? "").trim() === "") {
        setError(`${f.label.replace(/\s*\*$/, "")} is required.`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of collection.fields) {
        const fallback = collection.defaults[f.key];
        let value: unknown = form[f.key];
        if (f.type === "number") {
          if (value === "" || value === null || value === undefined) value = null;
          else value = Number(value);
        }
        if (typeof fallback === "boolean") value = Boolean(value);
        payload[f.key] = value;
      }
      const res = await csrfFetch(
        editingId ? `${collection.endpoint}/${editingId}` : collection.endpoint,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) || "Save failed");
        return;
      }
      setDialogOpen(false);
      await load();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await csrfFetch(`${collection.endpoint}/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data.error as string) || "Delete failed");
        return;
      }
      setDeleteTarget(null);
      await load();
    } catch {
      setError("Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const renderField = (f: FieldDef) => {
    const value = form[f.key];
    if (f.type === "checkbox") {
      return (
        <label key={f.key} className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => setField(f.key, e.target.checked)}
            className="h-4 w-4"
          />
          {f.label}
          {f.hint && <span className="text-xs font-normal text-muted-foreground">— {f.hint}</span>}
        </label>
      );
    }
    return (
      <div key={f.key} className="space-y-1.5">
        <Label className="text-sm">{f.label}</Label>
        {f.type === "textarea" ? (
          <textarea
            value={String(value ?? "")}
            onChange={(e) => setField(f.key, e.target.value)}
            rows={f.key === "content" ? 8 : 3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        ) : f.type === "select" ? (
          <select
            value={String(value ?? "")}
            onChange={(e) => setField(f.key, e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {(f.options || []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <Input
            type={f.type === "number" ? "number" : f.type === "url" ? "url" : "text"}
            value={String(value ?? "")}
            onChange={(e) => setField(f.key, e.target.value)}
            className="text-sm"
          />
        )}
        {f.hint && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{collection.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New {collection.itemNoun}
        </Button>
      </div>

      {error && !dialogOpen && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button className="text-xs underline" onClick={() => { setError(null); load(); }}>
            <RotateCcw className="h-3 w-3 inline mr-1" />Retry
          </button>
        </div>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              {collection.columns.map((c) => (
                <th key={c.key} className="px-3 py-2 font-medium">{c.label}</th>
              ))}
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items === null && (
              <tr><td colSpan={collection.columns.length + 1} className="px-3 py-6 text-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading…
              </td></tr>
            )}
            {items !== null && items.length === 0 && (
              <tr><td colSpan={collection.columns.length + 1} className="px-3 py-6 text-center text-muted-foreground">
                No {collection.itemNoun}s yet.
              </td></tr>
            )}
            {items !== null && items.map((item) => (
              <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                {collection.columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2 align-top ${c.type === "truncate" ? "max-w-[24rem]" : ""}`}>
                    {c.type === "truncate" ? (
                      <span className="line-clamp-2">{displayValue(item, c.key, c.type)}</span>
                    ) : c.type === "rating" ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {displayValue(item, c.key, c.type)}
                      </span>
                    ) : (
                      displayValue(item, c.key, c.type)
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Button size="sm" variant="outline" className="h-7 mr-2 text-xs gap-1" onClick={() => openEdit(item)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteTarget(item)}>
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "New"} {collection.itemNoun}
            </DialogTitle>
            <DialogDescription>
              {editingId ? "Changes are saved and written to the audit log." : `Create a new ${collection.itemNoun}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">{collection.fields.map(renderField)}</div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : editingId ? "Save changes" : `Create ${collection.itemNoun}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title={`Delete this ${collection.itemNoun}?`}
        description={
          deleteTarget
            ? `"${String(deleteTarget[collection.columns[0].key] ?? "")}" will be removed permanently. This is recorded in the audit log.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={remove}
      />
    </div>
  );
}
