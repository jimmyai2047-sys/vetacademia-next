"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PlanCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: "",
    name: "",
    type: "COURSE",
    price: 0,
    description: "",
    programmeSlug: "",
    examSlug: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Failed to create plan");
      setSaving(false);
      return;
    }
    setSaving(false);
    setForm({
      slug: "",
      name: "",
      type: "COURSE",
      price: 0,
      description: "",
      programmeSlug: "",
      examSlug: "",
    });
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border p-4 space-y-3 bg-card mb-8"
    >
      <h3 className="font-semibold">Add New Plan</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Slug</label>
          <Input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="e.g. new-course"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Name</label>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Plan name"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Type</label>
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="COURSE">COURSE</option>
            <option value="EXAM">EXAM</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Price (Rs.)</label>
          <Input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => set("price", Number(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Programme slug (courses)</label>
          <Input
            value={form.programmeSlug}
            onChange={(e) => set("programmeSlug", e.target.value)}
            placeholder="bvsc | ahdp | mvsc | phd"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Exam slug (exams)</label>
          <Input
            value={form.examSlug}
            onChange={(e) => set("examSlug", e.target.value)}
            placeholder="veterinary-officer | icar-jrf-srf | net | ars"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Creating..." : "Create Plan"}
      </Button>
    </form>
  );
}
