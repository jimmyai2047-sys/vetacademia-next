"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check } from "lucide-react";
import { VALIDITY_OPTIONS } from "@/lib/plan-validity";

type PlanRow = {
  slug: string;
  name: string;
  type: string;
  description: string | null;
  price: number;
  validityDays: number | null;
  isListed?: boolean;
};

export default function PlanEditor({ plan }: { plan: PlanRow }) {
  const [price, setPrice] = useState(plan.price);
  const [description, setDescription] = useState(plan.description ?? "");
  const [validityDays, setValidityDays] = useState(
    plan.validityDays != null ? String(plan.validityDays) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/plans/${plan.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price,
          description,
          validityDays: validityDays === "" ? null : Number(validityDays),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-card">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-medium">{plan.name}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            {plan.type}
          </div>
          {plan.isListed === false && (
            <span className="text-[10px] font-bold tracking-widest uppercase rounded-full bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5">
              Unlisted
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">{plan.slug}</div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Price (Rs.)</label>
        <Input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value) || 0)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Validity</label>
        <select
          value={validityDays}
          onChange={(e) => setValidityDays(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {VALIDITY_OPTIONS.map((o) => (
            <option key={o.label} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : null}
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </Button>
      </div>
    </div>
  );
}
