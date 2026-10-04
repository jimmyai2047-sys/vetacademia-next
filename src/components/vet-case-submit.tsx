"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Upload, CheckCircle, Clock } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";

const SPECIES = [
  "Cattle",
  "Buffalo",
  "Goat / Sheep",
  "Horse",
  "Dog / Cat",
  "Poultry",
];

export default function VetCaseSubmit() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [species, setSpecies] = useState(SPECIES[0]);
  const [age, setAge] = useState("");
  const [contact, setContact] = useState("");
  const [history, setHistory] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("species", species);
      fd.append("age", age);
      fd.append("contact", contact);
      fd.append("history", history);
      for (const f of photos.slice(0, 3)) fd.append("photos", f);
      const res = await csrfFetch("/api/vet-cases", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Failed to submit case. Please try again.");
        return;
      }
      setSubmitted(true);
      setSpecies(SPECIES[0]);
      setAge("");
      setContact("");
      setHistory("");
      setPhotos([]);
      setTimeout(() => setSubmitted(false), 6000);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="rounded-[1.25rem] border-emerald-200 bg-emerald-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
          <p className="text-sm font-semibold mt-2">Case submitted!</p>
          <p className="text-sm text-muted-foreground">An expert will review it within 24 hours. Please keep your WhatsApp reachable.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[1.25rem] border-primary/10 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="h-4 w-4 text-blue-600" /> Submit Case for Expert Review
          <Badge variant="outline" className="ml-auto rounded-full text-xs gap-1">
            <Clock className="h-3 w-3" /> 24h review
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Share history and photos — a verified vet will review your case.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Species *</Label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                required
              >
                {SPECIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Age</Label>
              <Input
                placeholder="3 years"
                className="h-9 rounded-xl"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contact (WhatsApp) *</Label>
              <Input
                placeholder="+91..."
                className="h-9 rounded-xl"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                minLength={5}
                maxLength={20}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Case History *</Label>
            <Textarea
              placeholder="Signs, duration, treatment tried, vitals..."
              rows={3}
              className="rounded-xl"
              required
              minLength={10}
              maxLength={2000}
              value={history}
              onChange={(e) => setHistory(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Upload className="h-3.5 w-3.5" /> Photos (optional)
            </Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              className="rounded-xl"
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 3))}
            />
            <p className="text-xs text-muted-foreground">Max 3 photos, 5MB each</p>
          </div>
          {error && (
            <p className="text-xs font-medium text-red-600 rounded-xl bg-red-50 border border-red-200 px-3 py-2">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full rounded-xl gap-2">
            {loading ? "Submitting..." : "Submit Case"}
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
