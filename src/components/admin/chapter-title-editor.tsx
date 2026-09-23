"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Pencil } from "lucide-react";

export default function ChapterTitleEditor({
  chapterId,
  initialTitle,
  unitNumber,
  initialIsDemo,
}: {
  chapterId: string;
  initialTitle: string;
  unitNumber?: number | null;
  initialIsDemo?: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(!!initialIsDemo);
  const [demoSaving, setDemoSaving] = useState(false);

  async function toggleDemo() {
    setDemoSaving(true);
    try {
      const res = await fetch(`/api/admin/chapter/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDemo: !isDemo }),
      });
      if (res.ok) setIsDemo(!isDemo);
    } finally {
      setDemoSaving(false);
    }
  }

  async function save() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === initialTitle) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/chapter/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to save");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const prefix = unitNumber ? `Unit ${unitNumber}: ` : "";

  if (!editing) {
    return (
      <div className="flex items-center gap-2 group flex-wrap">
        <span className="text-sm font-medium">
          {prefix}{title}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        {saved && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" /> Saved
          </span>
        )}
        {initialIsDemo !== undefined && (
          <button
            type="button"
            onClick={toggleDemo}
            disabled={demoSaving}
            title={isDemo ? "Free preview ON — click to lock" : "Locked — click to make free preview"}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border transition-colors ${
              isDemo
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-muted-foreground border-primary/15 hover:border-emerald-600/50 hover:text-emerald-700"
            }`}
          >
            {isDemo ? "Free" : "Locked"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {unitNumber && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Unit {unitNumber}:
        </span>
      )}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-8 text-sm flex-1"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setTitle(initialTitle);
            setEditing(false);
          }
        }}
      />
      <Button size="sm" onClick={save} disabled={saving} className="h-8">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setTitle(initialTitle);
          setEditing(false);
        }}
        className="h-8"
      >
        Cancel
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
