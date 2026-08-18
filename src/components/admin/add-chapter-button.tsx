"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export default function AddChapterButton({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    const title = prompt("Chapter title daalein:");
    if (!title?.trim()) return;

    setAdding(true);
    try {
      const res = await fetch("/api/admin/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          chapters: [{ title: title.trim(), content: "", unitNumber: 1, type: null }],
        }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to add chapter");
      }
    } catch {
      alert("Failed to add chapter");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Button onClick={handleAdd} disabled={adding} size="sm" className="gap-1.5">
      {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
      {adding ? "Adding..." : "Add Chapter"}
    </Button>
  );
}
