"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

export default function ChapterTextEditor({
  chapterId,
  initialText,
}: {
  chapterId: string;
  initialText: string;
}) {
  const [text, setText] = useState(initialText || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/chapter/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Save failed");
        return;
      }
      setSaved(true);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border p-3 bg-card space-y-2">
      <label className="text-xs font-medium text-muted-foreground">
        Chapter Text (typed notes)
      </label>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        rows={4}
        placeholder="Type or paste chapter content / notes here..."
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Save Text"
          )}
        </Button>
        {saved && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
