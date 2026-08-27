"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";

export default function SyllabusBookmarkButton({ subjectId }: { subjectId: string }) {
  const [saved, setSaved] = useState(false);
  // Simple localStorage bookmark for demo; real would call /api/bookmarks
  function toggle() {
    setSaved(!saved);
    const key = "syllabus-bookmarks";
    const raw = localStorage.getItem(key);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    const next = saved ? arr.filter((x) => x !== subjectId) : [...arr, subjectId];
    localStorage.setItem(key, JSON.stringify(next));
  }
  return (
    <Button
      variant={saved ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      className="h-7 rounded-full gap-1 text-xs"
      aria-label={saved ? "Remove bookmark" : "Bookmark subject"}
    >
      {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
