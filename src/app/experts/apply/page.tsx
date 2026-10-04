"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EXPERT_FIELD_CATEGORIES } from "@/lib/expert-proforma";
import { Plus, Trash2, Link2, Check } from "lucide-react";

type QualificationRow = { degree: string; year: string; institution: string };

const emptyQualification = (): QualificationRow => ({ degree: "", year: "", institution: "" });

function SectionTitle({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-primary text-white text-sm font-bold shadow-sm">
        {step}
      </span>
      <div>
        <h3 className="font-semibold leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export default function ApplyExpertPage() {
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [presentPosting, setPresentPosting] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [fieldCategory, setFieldCategory] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [qualifications, setQualifications] = useState<QualificationRow[]>([emptyQualification()]);
  const [bio, setBio] = useState("");
  const [awards, setAwards] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState("");

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/experts/upload-photo", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Photo upload failed");
        return;
      }
      setPhotoUrl(data.url);
      setPhotoPreview(data.downloadUrl || data.url);
    } catch {
      setError("Photo upload failed. Please try again.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  function updateQualification(i: number, patch: Partial<QualificationRow>) {
    setQualifications((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (qualifications.length === 0) {
      setError("Please add at least one qualification with its year of completion.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/experts/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          designation,
          gender: gender || undefined,
          dob: dob || undefined,
          email,
          phone,
          showContact,
          presentPosting,
          specialization,
          fieldCategory: fieldCategory || undefined,
          experienceYears: experienceYears ? Number(experienceYears) : undefined,
          qualifications,
          bio: bio || undefined,
          awards: awards || undefined,
          photoUrl: photoUrl || undefined,
          certificateUrl: certificateUrl || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to submit proforma");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-5 max-w-2xl">
      <DecorativePageHeader
        badge="Expert Proforma • All Fields Welcome"
        title="Expert Information"
        titleHighlight="Proforma"
        description="Fill this proforma carefully. After verification and admin approval, your profile will be published on the Experts page."
        variant="blue"
        actions={
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={copyLink}
            className="rounded-full gap-1.5 bg-white text-blue-600 hover:bg-white/90"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
            {copied ? "Link Copied" : "Copy & Circulate Link"}
          </Button>
        }
      />
      <div className="va-divider-dots my-6"><span /></div>
      <Card className="va-card-hover relative overflow-hidden rounded-[1.75rem] border-primary/5 bg-white shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-[#d4a843] to-primary" />
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle>Expert Proforma</CardTitle>
          <CardDescription>
            Fields marked * are required. Your details go live on the Experts page only after admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto h-1 w-12 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
              <p className="font-semibold">Proforma received!</p>
              <p className="text-sm text-muted-foreground">
                Thank you, {fullName || "Expert"}. Our admin team will verify your details.
                Once approved, your profile — name, designation, qualifications with year of
                completion, posting, specialization and contact (if consented) — will appear
                on the <Link href="/experts" className="text-primary underline">Experts page</Link>.
              </p>
              <div className="flex justify-center gap-2">
                <Link href="/experts">
                  <Button variant="outline" className="rounded-xl">View Experts Page</Button>
                </Link>
                <Button onClick={copyLink} variant="secondary" className="rounded-xl gap-1.5">
                  {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                  {copied ? "Copied" : "Share Proforma"}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-7">
              {/* 1 — Personal */}
              <section className="space-y-4">
                <SectionTitle step="1" title="Name & Designation" desc="As it should appear on the Experts page." />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Input id="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} required maxLength={150} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select (optional)</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email ID *</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Number *</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={15} />
                  </div>
                </div>
                <label className="flex items-start gap-2 text-sm rounded-xl border border-primary/10 bg-primary/[0.03] px-3 py-2.5 cursor-pointer">
                  <input type="checkbox" checked={showContact} onChange={(e) => setShowContact(e.target.checked)} className="rounded mt-0.5" />
                  <span>
                    Display my contact number & email publicly on my expert profile
                    <span className="block text-xs text-muted-foreground">Otherwise they are visible only to the admin team.</span>
                  </span>
                </label>
              </section>

              {/* 2 — Posting & specialization */}
              <section className="space-y-4">
                <SectionTitle step="2" title="Posting & Specialization" desc="Where you serve and what you specialize in." />
                <div className="space-y-2">
                  <Label htmlFor="presentPosting">Present Posting Place *</Label>
                  <Input id="presentPosting" value={presentPosting} onChange={(e) => setPresentPosting(e.target.value)} required maxLength={250} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization *</Label>
                    <Input id="specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required maxLength={200} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fieldCategory">Field / Discipline</Label>
                    <Input id="fieldCategory" list="field-categories" value={fieldCategory} onChange={(e) => setFieldCategory(e.target.value)} maxLength={100} />
                    <datalist id="field-categories">
                      {EXPERT_FIELD_CATEGORIES.map((f) => (
                        <option key={f} value={f} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-2 max-w-[220px]">
                  <Label htmlFor="experienceYears">Experience (years)</Label>
                  <Input id="experienceYears" type="number" min={0} max={80} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
                </div>
              </section>

              {/* 3 — Qualifications */}
              <section className="space-y-4">
                <SectionTitle step="3" title="Qualifications" desc="Each degree with its year of completion (e.g. B.V.Sc & A.H. — 2005)." />
                <div className="space-y-3">
                  {qualifications.map((q, i) => (
                    <div key={i} className="rounded-2xl border border-primary/10 bg-muted/20 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Qualification {i + 1}</span>
                        {qualifications.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" className="h-7 rounded-lg text-red-600 hover:bg-red-50" onClick={() => setQualifications((rows) => rows.filter((_, idx) => idx !== i))}>
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Degree / Qualification *</Label>
                          <Input value={q.degree} onChange={(e) => updateQualification(i, { degree: e.target.value })} required maxLength={150} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Year of Completion *</Label>
                          <Input value={q.year} onChange={(e) => updateQualification(i, { year: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) })} required inputMode="numeric" pattern="\d{4}" minLength={4} maxLength={4} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>University / Institution</Label>
                        <Input value={q.institution} onChange={(e) => updateQualification(i, { institution: e.target.value })} maxLength={200} />
                      </div>
                    </div>
                  ))}
                </div>
                {qualifications.length < 10 && (
                  <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setQualifications((rows) => [...rows, emptyQualification()])}>
                    <Plus className="h-3.5 w-3.5" /> Add Another Qualification
                  </Button>
                )}
              </section>

              {/* 4 — Profile extras */}
              <section className="space-y-4">
                <SectionTitle step="4" title="Profile & Links" desc="Shown on your public expert profile." />
                <div className="space-y-2">
                  <Label htmlFor="bio">Brief Profile / Bio</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={2000} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awards">Awards / Publications (optional)</Label>
                  <Textarea id="awards" value={awards} onChange={(e) => setAwards(e.target.value)} maxLength={2000} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="photoUrl">Photo (optional)</Label>
                    {photoPreview ? (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoPreview} alt="photo preview" className="h-16 w-16 rounded-xl object-cover border shadow-sm" />
                        <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => { setPhotoUrl(""); setPhotoPreview(null); }}>
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          disabled={uploadingPhoto}
                          onChange={handlePhotoUpload}
                          className="rounded-xl cursor-pointer"
                        />
                        <Input id="photoUrl" type="url" value={photoUrl} onChange={(e) => { setPhotoUrl(e.target.value); setPhotoPreview(e.target.value || null); }} />
                        {uploadingPhoto && <p className="text-xs text-muted-foreground">Uploading photo…</p>}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certificateUrl">Certificate URL (optional)</Label>
                    <Input id="certificateUrl" type="url" value={certificateUrl} onChange={(e) => setCertificateUrl(e.target.value)} />
                  </div>
                </div>
              </section>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/10">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full rounded-xl shadow-md" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Proforma for Approval"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                By submitting, you confirm the details are correct. Publication on the Experts page is subject to admin verification.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
