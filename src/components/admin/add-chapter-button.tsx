"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

export default function AddChapterButton({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  async function handleAdd() {
    if (!title.trim()) return;

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
        setOpen(false);
        setTitle("");
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
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add Chapter
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="chapter-title">Chapter Title</Label>
            <Input
              id="chapter-title"
              placeholder="Enter chapter title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={adding || !title.trim()}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {adding ? "Adding..." : "Add Chapter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
