"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";

function flash(msg: string) {
  // eslint-disable-next-line no-alert
  alert(msg);
}

type BookmarkItem = {
  id: string;
  type: string;
  refId: string;
  title: string;
  url: string;
  createdAt: string;
};

const TYPE_LABEL: Record<string, string> = {
  chapter: "Chapter",
  material: "Study Material",
  question: "Question",
  paper: "Paper",
  mocktest: "Mock Test",
  flashcard: "Flashcards",
};

export default function SavedPage() {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks");
      if (res.status === 401) {
        setAuthError(true);
        return;
      }
      const d = await res.json();
      setItems(d.bookmarks ?? []);
    } catch {
      flash("Could not load saved items");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    try {
          await csrfFetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((b) => b.id !== id));
      flash("Removed");
    } catch {
      flash("Could not remove");
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Bookmark className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Saved Items</h1>
      </div>

      {authError ? (
        <p className="text-muted-foreground">
          Please{" "}
          <Link href="/login" className="text-primary hover:underline">
            log in
          </Link>{" "}
          to view your saved items.
        </p>
      ) : loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">
          You have no saved items yet. Use the “Save” button on chapters, study
          materials, and papers to keep them here for quick revision.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <span className="text-xs uppercase tracking-wide text-primary">
                  {TYPE_LABEL[b.type] ?? b.type}
                </span>
                <Link
                  href={b.url}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {b.title}
                </Link>
              </div>
              <button
                type="button"
                onClick={() => remove(b.id)}
                aria-label="Remove"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
