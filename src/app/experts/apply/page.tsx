"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DecorativePageHeader } from "@/components/decorative/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ApplyExpertPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [bio, setBio] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/experts/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          specialization,
          experienceYears: experienceYears ? Number(experienceYears) : undefined,
          bio: bio || undefined,
          certificateUrl: certificateUrl || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to submit application");
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
    <div className="container mx-auto px-4 py-5 max-w-xl">
      <DecorativePageHeader
        badge="Expert Network"
        title="Apply as an"
        titleHighlight="Expert"
        description="Share your details and our team will review your application."
        variant="blue"
      />
      <div className="va-divider-dots my-6"><span /></div>
      <Card className="va-card-hover relative overflow-hidden rounded-[1.75rem] border-primary/5 bg-white shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-[#d4a843] to-primary" />
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle>Apply as an Expert</CardTitle>
          <CardDescription>
            Share your details and our team will review your application.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="va-divider-dots mb-4 max-w-[120px]"><span /></div>
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto h-1 w-12 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
              <p className="text-muted-foreground">
                Thank you! Your application has been received. Our team will get
                in touch via email.
              </p>
              <Link href="/experts">
                <Button variant="outline" className="rounded-xl">Back to Experts</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceYears">Years of Experience</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min={0}
                  max={80}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief professional background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificateUrl">Certificate URL (optional)</Label>
                <Input
                  id="certificateUrl"
                  type="url"
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/10">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full rounded-xl shadow-md" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Application"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
