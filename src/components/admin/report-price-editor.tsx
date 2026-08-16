"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check } from "lucide-react";
import { farmTypeLabel } from "@/lib/farm-types";

export type ReportPriceRow = {
  id: string;
  title: string;
  farmType: string;
  price: number;
  published: boolean;
  order: number;
};

export default function ReportPriceEditor({
  report,
}: {
  report: ReportPriceRow;
}) {
  const [price, setPrice] = useState(report.price);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/project-reports/${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: report.title,
          farmType: report.farmType,
          price,
          published: report.published,
          order: report.order,
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
        <div className="min-w-0">
          <div className="truncate font-medium">{report.title}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            {farmTypeLabel(report.farmType)}
          </div>
        </div>
        {!report.published && (
          <span className="shrink-0 text-xs font-medium text-amber-600">
            Draft
          </span>
        )}
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
