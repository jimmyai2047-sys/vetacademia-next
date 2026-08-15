"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROGRAMME_REFS, EXAM_REFS } from "@/lib/community-constants";

type LinkRow = {
  id: string;
  platform: "WHATSAPP" | "TELEGRAM";
  category: "PROGRAMME" | "EXAM";
  ref: string;
  title: string;
  url: string;
  active: boolean;
};

type FormState = {
  platform: "WHATSAPP" | "TELEGRAM";
  category: "PROGRAMME" | "EXAM";
  ref: string;
  title: string;
  url: string;
  active: boolean;
};

const emptyForm: FormState = {
  platform: "WHATSAPP",
  category: "PROGRAMME",
  ref: "bvsc",
  title: "",
  url: "",
  active: true,
};

export default function CommunityManager() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refOptions = form.category === "PROGRAMME" ? PROGRAMME_REFS : EXAM_REFS;

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/community");
    if (res.ok) setLinks(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(link: LinkRow) {
    setEditingId(link.id);
    setForm({
      platform: link.platform,
      category: link.category,
      ref: link.ref,
      title: link.title,
      url: link.url,
      active: link.active,
    });
    setError(null);
  }

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.url.trim()) {
      setError("Title and URL are required.");
      return;
    }
    setSaving(true);
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `/api/admin/community/${editingId}`
      : "/api/admin/community";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
    if (!confirm("Delete this community link?")) return;
    const res = await fetch(`/api/admin/community/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Community Links</h1>
        <p className="text-muted-foreground">
          Manage WhatsApp groups and Telegram channels shown to enrolled users.
        </p>
      </div>

      <section className="rounded-xl border p-5 bg-card">
        <h2 className="font-semibold mb-4">
          {editingId ? "Edit Link" : "Add Link"}
        </h2>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Platform</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.platform}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  platform: e.target.value as "WHATSAPP" | "TELEGRAM",
                }))
              }
            >
              <option value="WHATSAPP">WhatsApp</option>
              <option value="TELEGRAM">Telegram</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Category</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => {
                const category = e.target.value as "PROGRAMME" | "EXAM";
                setForm((f) => ({
                  ...f,
                  category,
                  ref: category === "PROGRAMME" ? "bvsc" : "psc",
                }));
              }}
            >
              <option value="PROGRAMME">Programme</option>
              <option value="EXAM">Examination</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              {form.category === "PROGRAMME"
                ? "Programme"
                : "Examination"}
            </label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.ref}
              onChange={(e) => setForm((f) => ({ ...f, ref: e.target.value }))}
            >
              {refOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. BVSc 3rd Year Group"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">
              Invite Link (URL)
            </label>
            <Input
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://chat.whatsapp.com/... or https://t.me/..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
            />
            <label htmlFor="active" className="text-sm">
              Active
            </label>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            {editingId && (
              <Button type="button" variant="outline" onClick={reset}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Add Link"}
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </section>

      <section>
        <h2 className="font-semibold mb-3">Existing Links</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : links.length === 0 ? (
          <p className="text-muted-foreground">No links yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Platform</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Ref</th>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">URL</th>
                  <th className="text-left p-3">Active</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="p-3">{l.platform}</td>
                    <td className="p-3">{l.category}</td>
                    <td className="p-3">{l.ref}</td>
                    <td className="p-3">{l.title}</td>
                    <td className="p-3 max-w-[200px] truncate">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {l.url}
                      </a>
                    </td>
                    <td className="p-3">{l.active ? "Yes" : "No"}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        className="text-primary hover:underline mr-3"
                        onClick={() => startEdit(l)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => remove(l.id)}
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
