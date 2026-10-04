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
  Crown,
  Sparkles,
  Users,
  ArrowLeft,
  ClipboardList,
  CheckCircle,
  XCircle,
  MapPin,
  GraduationCap,
  Phone,
  Mail,
} from "lucide-react";
import Link from "next/link";

type Qualification = {
  id?: string;
  degree: string;
  year?: string | null;
  institution?: string | null;
};

type Expert = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  fieldCategory: string | null;
  designation: string | null;
  gender: string | null;
  dob: string | null;
  presentPosting: string | null;
  contactPhone: string | null;
  showContact: boolean;
  experienceYears: number | null;
  qualifications: Qualification[];
  bio: string | null;
  awards: string | null;
  photoUrl: string | null;
  photoUrlBase?: string | null;
  hourlyRate: number;
  isAvailable: boolean;
  rating: number;
  totalReviews: number;
};

type Application = {
  id: string;
  fullName: string;
  designation: string;
  gender: string | null;
  dob: string | null;
  email: string;
  phone: string;
  presentPosting: string;
  specialization: string;
  fieldCategory: string | null;
  experienceYears: number | null;
  bio: string | null;
  awards: string | null;
  photoUrl: string | null;
  certificateUrl: string | null;
  qualifications: string;
  showContact: boolean;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

function parseQuals(raw: string): Qualification[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((q) => q && typeof q.degree === "string");
  } catch {
    return [];
  }
}

const emptyQual = (): Qualification => ({ degree: "", year: "", institution: "" });

export default function AdminExpertsPage({
  initialTab = "experts",
}: {
  initialTab?: "experts" | "applications";
} = {}) {
  const [tab, setTab] = useState<"experts" | "applications">(initialTab);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appStatus, setAppStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [editing, setEditing] = useState<Expert | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [approving, setApproving] = useState<Application | null>(null);
  const [approveAvailable, setApproveAvailable] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [savingApp, setSavingApp] = useState(false);
  const [appForm, setAppForm] = useState({
    fullName: "",
    designation: "",
    gender: "",
    dob: "",
    email: "",
    phone: "",
    showContact: false,
    presentPosting: "",
    specialization: "",
    fieldCategory: "",
    experienceYears: "",
    bio: "",
    awards: "",
    photoUrl: "",
    certificateUrl: "",
    qualifications: [emptyQual()] as Qualification[],
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    designation: "",
    gender: "",
    dob: "",
    fieldCategory: "",
    presentPosting: "",
    contactPhone: "",
    showContact: false,
    experienceYears: "",
    qualifications: [emptyQual()] as Qualification[],
    specialization: "",
    bio: "",
    awards: "",
    isAvailable: true,
    photoUrl: "" as string | null,
  });

  async function fetchExperts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/experts");
      if (res.ok) setExperts(await res.json());
      else {
        const data = await res.json().catch(() => null);
        setError((data as { error?: string } | null)?.error || "Failed to load");
      }
    } catch {
      setError("Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplications(status = appStatus) {
    setAppsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/expert-applications?status=${status}`);
      if (res.ok) setApplications(await res.json());
      else {
        const data = await res.json().catch(() => null);
        setError((data as { error?: string } | null)?.error || "Failed to load applications");
      }
    } catch {
      setError("Failed to load applications");
    } finally {
      setAppsLoading(false);
    }
  }

  useEffect(() => {
    // Deferred so initial data loading doesn't setState synchronously in the effect.
    const id = window.setTimeout(() => {
      fetchExperts();
      fetchApplications("PENDING");
    }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setPreviewUrl(null);
    setForm({
      name: "",
      email: "",
      password: "",
      designation: "",
      gender: "",
      dob: "",
      fieldCategory: "",
      presentPosting: "",
      contactPhone: "",
      showContact: false,
      experienceYears: "",
      qualifications: [emptyQual()],
      specialization: "",
      bio: "",
      awards: "",
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
      designation: e.designation || "",
      gender: e.gender || "",
      dob: e.dob || "",
      fieldCategory: e.fieldCategory || "",
      presentPosting: e.presentPosting || "",
      contactPhone: e.contactPhone || "",
      showContact: e.showContact,
      experienceYears: e.experienceYears != null ? String(e.experienceYears) : "",
      qualifications: e.qualifications.length ? e.qualifications.map((q) => ({ ...q })) : [emptyQual()],
      specialization: e.specialization,
      bio: e.bio || "",
      awards: e.awards || "",
      isAvailable: e.isAvailable,
      photoUrl: e.photoUrlBase ?? null,
    });
    setShowForm(true);
  }

  function updateQual(i: number, patch: Partial<Qualification>) {
    setForm((f) => ({
      ...f,
      qualifications: f.qualifications.map((q, idx) => (idx === i ? { ...q, ...patch } : q)),
    }));
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
        designation: form.designation || undefined,
        gender: form.gender || undefined,
        dob: form.dob || undefined,
        fieldCategory: form.fieldCategory || undefined,
        presentPosting: form.presentPosting || undefined,
        contactPhone: form.contactPhone || undefined,
        showContact: form.showContact,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        qualifications: form.qualifications
          .filter((q) => q.degree.trim())
          .map((q) => ({ degree: q.degree.trim(), year: q.year || "", institution: q.institution || "" })),
        specialization: form.specialization,
        bio: form.bio,
        awards: form.awards || undefined,
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
      if (!editing && data.temporaryPassword) {
        setNotice(`Expert created. Temporary password: ${data.temporaryPassword} — share it with the expert.`);
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

  async function handleApprove() {
    if (!approving) return;
    setReviewing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/expert-applications/${approving.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: approveAvailable }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Approval failed");
        return;
      }
      setNotice(
        `Approved — "${approving.fullName}" is now live on the Experts page.` +
          (data.temporaryPassword ? ` Temporary password: ${data.temporaryPassword}` : " (linked to existing login)")
      );
      setApproving(null);
      fetchApplications();
      fetchExperts();
    } catch {
      setError("Network error while approving");
    } finally {
      setReviewing(false);
    }
  }

  async function handleReject(app: Application) {
    let note = rejectNote;
    if (!note) {
      const prompted = window.prompt("Reason for rejection (optional):");
      if (prompted === null) return;
      note = prompted;
    }
    setReviewing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/expert-applications/${app.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: note.slice(0, 500) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Rejection failed");
        return;
      }
      setRejectNote("");
      setNotice(`Application from "${app.fullName}" marked as rejected.`);
      fetchApplications();
    } catch {
      setError("Network error while rejecting");
    } finally {
      setReviewing(false);
    }
  }

  function openEditApp(a: Application) {
    setApproving(null);
    setEditingApp(a);
    const quals = parseQuals(a.qualifications).map((q) => ({
      degree: q.degree,
      year: q.year || "",
      institution: q.institution || "",
    }));
    setAppForm({
      fullName: a.fullName,
      designation: a.designation,
      gender: a.gender || "",
      dob: a.dob || "",
      email: a.email,
      phone: a.phone,
      showContact: a.showContact,
      presentPosting: a.presentPosting,
      specialization: a.specialization,
      fieldCategory: a.fieldCategory || "",
      experienceYears: a.experienceYears != null ? String(a.experienceYears) : "",
      bio: a.bio || "",
      awards: a.awards || "",
      photoUrl: a.photoUrl || "",
      certificateUrl: a.certificateUrl || "",
      qualifications: quals.length ? quals : [emptyQual()],
    });
  }

  function updateAppQual(i: number, patch: Partial<Qualification>) {
    setAppForm((f) => ({
      ...f,
      qualifications: f.qualifications.map((q, idx) => (idx === i ? { ...q, ...patch } : q)),
    }));
  }

  async function handleSaveApp() {
    if (!editingApp) return;
    setSavingApp(true);
    setError(null);
    try {
      const payload = {
        fullName: appForm.fullName,
        designation: appForm.designation,
        gender: appForm.gender || undefined,
        dob: appForm.dob || undefined,
        email: appForm.email,
        phone: appForm.phone,
        showContact: appForm.showContact,
        presentPosting: appForm.presentPosting,
        specialization: appForm.specialization,
        fieldCategory: appForm.fieldCategory || undefined,
        experienceYears: appForm.experienceYears ? Number(appForm.experienceYears) : undefined,
        bio: appForm.bio || undefined,
        awards: appForm.awards || undefined,
        photoUrl: appForm.photoUrl || undefined,
        certificateUrl: appForm.certificateUrl || undefined,
        qualifications: appForm.qualifications
          .filter((q) => q.degree.trim())
          .map((q) => ({
            degree: q.degree.trim(),
            year: (q.year || "").trim(),
            institution: (q.institution || "").trim(),
          })),
      };
      const res = await fetch(`/api/admin/expert-applications/${editingApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      setNotice(`Proforma for "${appForm.fullName || editingApp.fullName}" updated — verify, then approve to publish.`);
      setEditingApp(null);
      fetchApplications();
    } catch {
      setError("Network error while updating proforma");
    } finally {
      setSavingApp(false);
    }
  }

  const pendingCount = appStatus === "PENDING" ? applications.length : null;

  return (
    <div className="space-y-6">
      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e] via-primary to-[#0284c7]" />
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
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => { setTab("applications"); fetchApplications(); }}
              className="rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-white/25 gap-2"
            >
              <ClipboardList className="h-4 w-4" /> Proforma Applications
              {pendingCount != null && pendingCount > 0 && (
                <span className="rounded-full bg-[#d4a843] px-2 py-0.5 text-xs font-bold text-black">{pendingCount}</span>
              )}
            </Button>
            {tab === "experts" && !showForm && (
              <Button onClick={openCreate} className="rounded-xl bg-white text-primary hover:bg-white/90 shadow-md gap-2 font-semibold">
                <Plus className="h-4 w-4" /> Add Expert
              </Button>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div className="relative px-6 pb-4 flex gap-2">
          <Button
            size="sm"
            onClick={() => setTab("experts")}
            className={tab === "experts" ? "rounded-xl bg-white text-primary font-semibold" : "rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20"}
          >
            Expert Profiles ({experts.length})
          </Button>
          <Button
            size="sm"
            onClick={() => { setTab("applications"); fetchApplications(); }}
            className={tab === "applications" ? "rounded-xl bg-white text-primary font-semibold" : "rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20"}
          >
            Proforma Applications
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start justify-between gap-2">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}

      {tab === "applications" ? (
        <div className="space-y-4">
          <Card className="rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-muted-foreground flex-1">
                Proforma submissions from <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">/experts/apply</span> — circulate that link to experts. Approving publishes the profile on the Experts page.
              </p>
              <div className="flex gap-2 items-center">
                <select
                  value={appStatus}
                  onChange={(e) => { setAppStatus(e.target.value); fetchApplications(e.target.value); }}
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="ALL">All</option>
                </select>
                <Link href="/experts/apply" target="_blank">
                  <Button variant="outline" size="sm" className="rounded-xl">Open Proforma</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {appsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground rounded-xl border border-dashed border-primary/10 bg-muted/20 px-4 py-6 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading applications…
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 rounded-[1.25rem] border border-dashed border-primary/10 bg-muted/20">
              <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground">No {appStatus.toLowerCase()} applications.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((a) => {
                const quals = parseQuals(a.qualifications);
                return (
                  <Card key={a.id} className="relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
                    <CardContent className="p-5 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-lg">{a.fullName}</p>
                          <p className="text-sm text-muted-foreground">{a.designation} • {a.specialization}{a.fieldCategory ? ` (${a.fieldCategory})` : ""}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {a.phone}</span>
                            <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {a.email}</span>
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.presentPosting}</span>
                          </p>
                        </div>
                        <Badge variant={a.status === "PENDING" ? "default" : "secondary"} className={`rounded-full ${a.status === "PENDING" ? "bg-gradient-to-br from-primary to-[#0284c7] text-white border-0" : ""}`}>
                          {a.status}
                        </Badge>
                      </div>

                      {quals.length > 0 && (
                        <div className="rounded-xl border border-primary/10 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/50 text-left">
                                <th className="px-3 py-2 font-medium"><span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> Qualification</span></th>
                                <th className="px-3 py-2 font-medium">Year</th>
                                <th className="px-3 py-2 font-medium">Institution</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quals.map((q, i) => (
                                <tr key={i} className="border-t border-primary/5">
                                  <td className="px-3 py-2 font-medium">{q.degree}</td>
                                  <td className="px-3 py-2">{q.year || "—"}</td>
                                  <td className="px-3 py-2 text-muted-foreground">{q.institution || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground space-y-1">
                        {(a.gender || a.dob) && (
                          <p className="text-xs">
                            {[a.gender, a.dob ? `DOB ${a.dob}` : null].filter(Boolean).join(" • ")}
                          </p>
                        )}
                        {a.experienceYears != null && <p>Experience: <span className="font-medium text-foreground">{a.experienceYears} years</span></p>}
                        {a.bio && <p className="leading-relaxed">“{a.bio}”</p>}
                        {a.awards && <p className="leading-relaxed text-xs">Awards / Publications: {a.awards}</p>}
                        <p className="text-xs">
                          Submitted {new Date(a.createdAt).toLocaleString("en-IN")}
                          {a.showContact ? " • consented to show contact publicly" : " • contact admin-only"}
                          {a.certificateUrl && <> • <a href={a.certificateUrl} target="_blank" rel="noreferrer" className="text-primary underline">certificate</a></>}
                          {a.photoUrl && <> • <a href={a.photoUrl} target="_blank" rel="noreferrer" className="text-primary underline">photo</a></>}
                        </p>
                        {a.adminNote && <p className="text-xs">Admin note: {a.adminNote}</p>}
                      </div>

                      {editingApp?.id === a.id && (
                        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                          <p className="text-sm font-semibold flex items-center gap-1.5">
                            <Pencil className="h-3.5 w-3.5" /> Correct received proforma
                            <span className="font-normal text-muted-foreground">— changes apply on save, publishing still needs approval</span>
                          </p>
                          <div className="grid sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium">Full Name *</label>
                              <Input value={appForm.fullName} onChange={(e) => setAppForm({ ...appForm, fullName: e.target.value })} className="rounded-xl mt-1 bg-white" />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Designation *</label>
                              <Input value={appForm.designation} onChange={(e) => setAppForm({ ...appForm, designation: e.target.value })} className="rounded-xl mt-1 bg-white" />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Email *</label>
                              <Input type="email" value={appForm.email} onChange={(e) => setAppForm({ ...appForm, email: e.target.value })} className="rounded-xl mt-1 bg-white" />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Contact Number *</label>
                              <Input value={appForm.phone} onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })} className="rounded-xl mt-1 bg-white" />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Gender</label>
                              <select
                                value={appForm.gender}
                                onChange={(e) => setAppForm({ ...appForm, gender: e.target.value })}
                                className="w-full mt-1 rounded-xl border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Select (optional)</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium">Date of Birth</label>
                              <Input type="date" value={appForm.dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setAppForm({ ...appForm, dob: e.target.value })} className="rounded-xl mt-1 bg-white" />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-xs font-medium">Present Posting Place *</label>
                              <Input value={appForm.presentPosting} onChange={(e) => setAppForm({ ...appForm, presentPosting: e.target.value })} className="rounded-xl mt-1 bg-white" />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Specialization *</label>
                              <Input value={appForm.specialization} onChange={(e) => setAppForm({ ...appForm, specialization: e.target.value })} className="rounded-xl mt-1 bg-white" />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Field / Discipline</label>
                              <Input value={appForm.fieldCategory} onChange={(e) => setAppForm({ ...appForm, fieldCategory: e.target.value })} className="rounded-xl mt-1 bg-white" />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Experience (years)</label>
                              <Input type="number" min={0} max={80} value={appForm.experienceYears} onChange={(e) => setAppForm({ ...appForm, experienceYears: e.target.value })} className="rounded-xl mt-1 bg-white" />
                            </div>
                            <label className="flex items-center gap-2 text-xs pt-5">
                              <input type="checkbox" checked={appForm.showContact} onChange={(e) => setAppForm({ ...appForm, showContact: e.target.checked })} className="rounded" />
                              Show contact publicly
                            </label>
                            <div className="sm:col-span-2">
                              <label className="text-xs font-medium">Bio</label>
                              <textarea value={appForm.bio} onChange={(e) => setAppForm({ ...appForm, bio: e.target.value })} rows={2} className="w-full mt-1 rounded-xl border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-xs font-medium">Awards / Publications (optional)</label>
                              <textarea value={appForm.awards} onChange={(e) => setAppForm({ ...appForm, awards: e.target.value })} rows={2} className="w-full mt-1 rounded-xl border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Photo URL</label>
                              <Input type="url" value={appForm.photoUrl} onChange={(e) => setAppForm({ ...appForm, photoUrl: e.target.value })} className="rounded-xl mt-1 bg-white" />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Certificate URL</label>
                              <Input type="url" value={appForm.certificateUrl} onChange={(e) => setAppForm({ ...appForm, certificateUrl: e.target.value })} className="rounded-xl mt-1 bg-white" />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium">Qualifications (degree + year of completion)</label>
                            <div className="space-y-2 mt-1.5">
                              {appForm.qualifications.map((q, i) => (
                                <div key={i} className="grid grid-cols-[1fr_90px_1fr_auto] gap-2 items-center">
                                  <Input value={q.degree} onChange={(e) => updateAppQual(i, { degree: e.target.value })} placeholder="M.V.Sc (Surgery)" className="rounded-lg bg-white" />
                                  <Input value={q.year || ""} onChange={(e) => updateAppQual(i, { year: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) })} placeholder="Year" inputMode="numeric" className="rounded-lg bg-white" />
                                  <Input value={q.institution || ""} onChange={(e) => updateAppQual(i, { institution: e.target.value })} placeholder="Institution" className="rounded-lg bg-white" />
                                  {appForm.qualifications.length > 1 ? (
                                    <Button type="button" variant="ghost" size="icon" className="rounded-lg text-red-600 h-9 w-9" onClick={() => setAppForm((f) => ({ ...f, qualifications: f.qualifications.filter((_, idx) => idx !== i) }))}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  ) : <span />}
                                </div>
                              ))}
                            </div>
                            {appForm.qualifications.length < 10 && (
                              <Button type="button" variant="outline" size="sm" className="rounded-xl mt-2 gap-1 bg-white" onClick={() => setAppForm((f) => ({ ...f, qualifications: [...f.qualifications, emptyQual()] }))}>
                                <Plus className="h-3.5 w-3.5" /> Add Qualification
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" disabled={savingApp} onClick={handleSaveApp} className="rounded-xl gap-1">
                              {savingApp && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Changes
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-xl bg-white" onClick={() => setEditingApp(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}

                      {a.status === "PENDING" && (
                        <div className="pt-1">
                          {approving?.id === a.id ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex flex-col sm:flex-row gap-2 sm:items-end">
                              <label className="flex items-center gap-2 text-sm pb-2">
                                <input type="checkbox" checked={approveAvailable} onChange={(e) => setApproveAvailable(e.target.checked)} className="rounded" />
                                Available for consultation
                              </label>
                              <div className="flex gap-2 sm:ml-auto">
                                <Button size="sm" disabled={reviewing} onClick={handleApprove} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-1">
                                  {reviewing && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirm & Publish
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setApproving(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" onClick={() => { setApproving(a); setApproveAvailable(true); }} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-1">
                                <CheckCircle className="h-3.5 w-3.5" /> Approve & Publish
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openEditApp(a)} className="rounded-xl gap-1">
                                <Pencil className="h-3.5 w-3.5" /> Edit Proforma
                              </Button>
                              <Button size="sm" variant="outline" disabled={reviewing} onClick={() => handleReject(a)} className="rounded-xl gap-1 text-red-600 hover:bg-red-50 border-red-200">
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {showForm && (
            <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 shadow-sm bg-white">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#0284c7] text-white"><Sparkles className="h-4 w-4" /></span>
                  {editing ? "Edit Expert" : "Add Expert"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name *</label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Designation</label>
                      <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Professor & Head" className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Password {editing ? "(leave blank to keep)" : ""}
                      </label>
                      <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "••••••••" : "expert123"} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact Number</label>
                      <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+91 …" className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Gender</label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select (optional)</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date of Birth</label>
                      <Input type="date" value={form.dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Present Posting Place</label>
                      <Input value={form.presentPosting} onChange={(e) => setForm({ ...form, presentPosting: e.target.value })} placeholder="College / Hospital / Dept." className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Specialization *</label>
                      <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} required className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Field / Discipline</label>
                      <Input value={form.fieldCategory} onChange={(e) => setForm({ ...form, fieldCategory: e.target.value })} placeholder="Veterinary Surgery…" className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Experience (years)</label>
                      <Input type="number" min={0} max={80} value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} className="rounded-xl mt-1" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="rounded" />
                      Available for consultation
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.showContact} onChange={(e) => setForm({ ...form, showContact: e.target.checked })} className="rounded" />
                      Show contact publicly
                    </label>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Qualifications (degree + year of completion)</label>
                    <div className="space-y-2 mt-2">
                      {form.qualifications.map((q, i) => (
                        <div key={i} className="grid sm:grid-cols-[1fr_110px_1fr_auto] gap-2 items-center rounded-xl border border-primary/10 bg-muted/20 p-2">
                          <Input value={q.degree} onChange={(e) => updateQual(i, { degree: e.target.value })} placeholder="M.V.Sc (Surgery)" className="rounded-lg bg-white" />
                          <Input value={q.year || ""} onChange={(e) => updateQual(i, { year: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) })} placeholder="Year" inputMode="numeric" className="rounded-lg bg-white" />
                          <Input value={q.institution || ""} onChange={(e) => updateQual(i, { institution: e.target.value })} placeholder="Institution" className="rounded-lg bg-white" />
                          {form.qualifications.length > 1 ? (
                            <Button type="button" variant="ghost" size="icon" className="rounded-lg text-red-600" onClick={() => setForm((f) => ({ ...f, qualifications: f.qualifications.filter((_, idx) => idx !== i) }))}>
                              <X className="h-4 w-4" />
                            </Button>
                          ) : <span />}
                        </div>
                      ))}
                    </div>
                    {form.qualifications.length < 10 && (
                      <Button type="button" variant="outline" size="sm" className="rounded-xl mt-2 gap-1" onClick={() => setForm((f) => ({ ...f, qualifications: [...f.qualifications, emptyQual()] }))}>
                        <Plus className="h-3.5 w-3.5" /> Add Qualification
                      </Button>
                    )}
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
                    <label className="text-sm font-medium">Awards / Publications (optional)</label>
                    <textarea
                      className="w-full mt-1 min-h-[60px] rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.awards}
                      onChange={(e) => setForm({ ...form, awards: e.target.value })}
                      placeholder="Awards, honours and key publications — one per line"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Photo</label>
                    <div className="flex items-center gap-4 mt-2">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt="preview" className="h-20 w-20 rounded-xl object-cover border shadow-sm" />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center border border-dashed border-primary/10">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => fileRef.current?.click()} disabled={uploading}>
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload Photo"}
                        </Button>
                        {form.photoUrl && (
                          <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => { setForm({ ...form, photoUrl: null }); setPreviewUrl(null); }}>
                            <X className="h-4 w-4" /> Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-br from-primary to-[#0284c7] hover:from-primary/90 hover:to-[#0284c7]/90 text-white shadow-sm gap-2">
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {editing ? "Save Changes" : "Create Expert"}
                    </Button>
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setShowForm(false); setEditing(null); }}>
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
                        <img src={e.photoUrl} alt={e.name} className="h-14 w-14 rounded-xl object-cover border shadow-sm" loading="lazy" decoding="async" />
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-[#0284c7] text-white flex items-center justify-center font-semibold shadow-sm">
                          {e.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate group-hover:text-primary transition-colors">{e.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {[e.designation, e.specialization].filter(Boolean).join(" • ")}
                        </div>
                        {e.qualifications.length > 0 && (
                          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <GraduationCap className="h-3 w-3 shrink-0" />
                            {e.qualifications.map((q) => (q.year ? `${q.degree} (${q.year})` : q.degree)).join(", ")}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl gap-1" onClick={() => openEdit(e)}>
                        <Pencil className="h-3 w-3" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => handleDelete(e)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
