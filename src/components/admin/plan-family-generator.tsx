"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deriveDurationPrices } from "@/lib/plan-validity";

export default function PlanFamilyGenerator() {
  const router = useRouter();
  const [form, setForm] = useState({
    baseSlug: "",
    name: "",
    type: "COURSE",
    price: "",
    programmeSlug: "",
    examSlug: "",
    year: "",
    subjectId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setDone(null);
  }

  const lifetime = Number(form.price) || 0;
  const preview = lifetime > 0 ? deriveDurationPrices(Math.round(lifetime)) : [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setDone(null);
    const res = await fetch("/api/admin/plans/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseSlug: form.baseSlug.trim(),
        name: form.name.trim(),
        type: form.type,
        price: Number(form.price),
        programmeSlug: form.programmeSlug.trim() || null,
        examSlug: form.examSlug.trim() || null,
        year: form.year.trim() || null,
        subjectId: form.subjectId.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Failed to create plan family");
      setSaving(false);
      return;
    }
    setSaving(false);
    setDone(`Created ${data.plans?.length ?? 4} plans (lifetime + 6/12/24 months).`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-lg border p-4 space-y-3 bg-card mb-8">
      <h3 className="font-semibold">Add Plan Family (auto-priced durations)</h3>
      <p className="text-xs text-muted-foreground">
        Enter the scope + lifetime price once — 6 mo (50%), 12 mo (75%), 24 mo (90%) rows are derived automatically with 9-ending rounding.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Base slug (lifetime row)</label>
          <Input value={form.baseSlug} onChange={(e) => set("baseSlug", e.target.value)} placeholder="e.g. bvsc-1st-year" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Display name</label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. B.V.Sc & A.H. – 1st Year" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Type</label>
          <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="COURSE">COURSE</option>
            <option value="EXAM">EXAM</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Lifetime price (Rs.)</label>
          <Input type="number" min={1} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="e.g. 2499" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Programme slug</label>
          <Input value={form.programmeSlug} onChange={(e) => set("programmeSlug", e.target.value)} placeholder="bvsc | ahdp | mvsc | phd" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Exam slug</label>
          <Input value={form.examSlug} onChange={(e) => set("examSlug", e.target.value)} placeholder="veterinary-officer | net | …" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Year (course year plans)</label>
          <Input value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="1st Year" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Subject ID (subject plans)</label>
          <Input value={form.subjectId} onChange={(e) => set("subjectId", e.target.value)} placeholder="subject id" />
        </div>
      </div>

      {preview.length > 0 && (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground border-b bg-muted/40">
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Validity</th>
                <th className="px-3 py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((t) => (
                <tr key={t.label} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">
                    {t.validityDays == null
                      ? form.baseSlug || "—"
                      : `${form.baseSlug || "—"}${t.validityDays === 180 ? "-6mo" : t.validityDays === 365 ? "-12mo" : "-24mo"}`}
                  </td>
                  <td className="px-3 py-2">{t.label}</td>
                  <td className="px-3 py-2 text-right font-semibold">Rs.{t.price.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      {done && <p className="text-xs text-emerald-600 font-medium">{done}</p>}
      <Button type="submit" size="sm" disabled={saving || lifetime <= 0}>
        {saving ? "Creating family..." : "Create 4 Plans"}
      </Button>
    </form>
  );
}
