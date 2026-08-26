"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Image as ImageIcon,
  X,
  Star,
  IndianRupee,
  Crown,
  Sparkles,
  Users,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type Expert = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  bio: string | null;
  photoUrl: string | null;
  photoUrlBase?: string | null;
  hourlyRate: number;
  isAvailable: boolean;
  rating: number;
  totalReviews: number;
};

export default function AdminExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Expert | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    bio: "",
    hourlyRate: "",
    isAvailable: true,
    photoUrl: "" as string | null,
  });

  async function fetchExperts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/experts");
      if (res.ok) setExperts(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExperts();
  }, []);

  function openCreate() {
    setEditing(null);
    setPreviewUrl(null);
    setForm({
      name: "",
      email: "",
      password: "",
      specialization: "",
      bio: "",
      hourlyRate: "",
      isAvailable: true,
      photoUrl: null,
    });
    setShowForm(true);
  }

  function openEdit(e: Expert) {
    setEditing(e);
    setPreviewUrl(e.photoUrl);
    setForm({
      name: e.name,
      email: e.email,
      password: "",
      specialization: e.specialization,
      bio: e.bio || "",
      hourlyRate: String(e.hourlyRate),
      isAvailable: e.isAvailable,
      photoUrl: e.photoUrlBase ?? null,
    });
    setShowForm(true);
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setForm((f) => ({ ...f, photoUrl: data.url }));
        setPreviewUrl(data.downloadUrl);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        specialization: form.specialization,
        bio: form.bio,
        hourlyRate: Number(form.hourlyRate) || 0,
        isAvailable: form.isAvailable,
        photoUrl: form.photoUrl,
      };

      const res = editing
        ? await fetch(`/api/admin/experts/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/experts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setShowForm(false);
      setEditing(null);
      fetchExperts();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e: Expert) {
    if (!confirm(`Delete expert "${e.name}"? This also removes their login. This cannot be undone.`))
      return;
    try {
      const res = await fetch(`/api/admin/experts/${e.id}`, { method: "DELETE" });
      if (res.ok) fetchExperts();
      else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Delete failed");
      }
    } catch {
      setError("Network error while deleting expert");
    }
  }

  return (
    <div className="space-y-6">
      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" aria-label="Back to dashboard" className="rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-white/25 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-sm">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                <Crown className="h-3 w-3 text-[#d4a843]" /> Royal Experts
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Experts</h1>
              <p className="text-white/70 text-sm flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> Manage expert consultant profiles • {experts.length} profiles
              </p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={openCreate} className="rounded-xl bg-white text-primary hover:bg-white/90 shadow-md gap-2 font-semibold">
              <Plus className="h-4 w-4" /> Add Expert
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {showForm && (
        <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 shadow-sm bg-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white"><Sparkles className="h-4 w-4" /></span>
              {editing ? "Edit Expert" : "Add Expert"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Password {editing ? "(leave blank to keep)" : ""}
                  </label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editing ? "••••••••" : "expert123"}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Specialization *</label>
                  <Input
                    value={form.specialization}
                    onChange={(e) =>
                      setForm({ ...form, specialization: e.target.value })
                    }
                    required
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hourly Rate (₹)</label>
                  <Input
                    type="number"
                    value={form.hourlyRate}
                    onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isAvailable}
                      onChange={(e) =>
                        setForm({ ...form, isAvailable: e.target.checked })
                      }
                      className="rounded"
                    />
                    Available for consultation
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  className="w-full mt-1 min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Photo</label>
                <div className="flex items-center gap-4 mt-2">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="h-20 w-20 rounded-xl object-cover border shadow-sm"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center border border-dashed border-primary/10">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhoto}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Upload Photo"
                      )}
                    </Button>
                    {form.photoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                      setForm({ ...form, photoUrl: null });
                      setPreviewUrl(null);
                    }}
                      >
                        <X className="h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-br from-primary to-[#005f48] hover:from-primary/90 hover:to-[#005f48]/90 text-white shadow-sm gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Save Changes" : "Create Expert"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground rounded-xl border border-dashed border-primary/10 bg-muted/20 px-4 py-6 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : experts.length === 0 ? (
        <div className="text-center py-12 rounded-[1.25rem] border border-dashed border-primary/10 bg-muted/20">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">No experts yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map((e) => (
            <Card key={e.id} className="va-card-hover group relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm hover:shadow-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {e.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.photoUrl}
                      alt={e.name}
                      className="h-14 w-14 rounded-xl object-cover border shadow-sm"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white flex items-center justify-center font-semibold shadow-sm">
                      {e.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate group-hover:text-primary transition-colors">{e.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {e.specialization}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {e.hourlyRate}/hr
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {e.rating} ({e.totalReviews})
                      </span>
                    </div>
                  </div>
                  {e.isAvailable ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs rounded-full">
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs rounded-full">
                      Busy
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl gap-1"
                    onClick={() => openEdit(e)}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                    onClick={() => handleDelete(e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
