"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Pencil } from "lucide-react";

export default function ChapterTitleEditor({
  chapterId,
  initialTitle,
  unitNumber,
}: {
  chapterId: string;
  initialTitle: string;
  unitNumber?: number | null;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === initialTitle) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setSaved(false);
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
      }
    } finally {
      setSaving(false);
    }
  }

  const prefix = unitNumber ? `Unit ${unitNumber}: ` : "";

  if (!editing) {
    return (
      <div className="flex items-center gap-2 group">
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
    </div>
  );
}
