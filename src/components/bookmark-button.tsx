"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";

function flash(msg: string) {
  // Lightweight confirmation without an external toast dependency.
  // eslint-disable-next-line no-alert
  alert(msg);
}

type Props = {
  type: "chapter" | "material" | "question" | "paper" | "mocktest" | "flashcard";
  refId: string;
  title: string;
  url: string;
  variant?: "icon" | "full";
};

export default function BookmarkButton({
  type,
  refId,
  title,
  url,
  variant = "full",
}: Props) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((d) => {
        const list: { type: string; refId: string }[] = d.bookmarks ?? [];
        if (active) setSaved(list.some((b) => b.type === type && b.refId === refId));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [type, refId]);

  async function toggle() {
    setBusy(true);
    try {
      if (saved) {
        const d = await (await fetch("/api/bookmarks")).json();
        const list: { id: string; type: string; refId: string }[] = d.bookmarks ?? [];
        const match = list.find((b) => b.type === type && b.refId === refId);
        if (match) {
          await csrfFetch(`/api/bookmarks/${match.id}`, { method: "DELETE" });
        }
        setSaved(false);
        flash("Removed from saved items");
      } else {
        const res = await csrfFetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, refId, title, url }),
        });
        if (!res.ok) throw new Error("failed");
        setSaved(true);
        flash("Saved for later");
      }
    } catch {
      flash("Could not update bookmark");
    } finally {
      setBusy(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={saved ? "Remove bookmark" : "Bookmark"}
        title={saved ? "Saved" : "Save"}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
      >
        <Bookmark className={saved ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary disabled:opacity-50"
    >
      <Bookmark className={saved ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
