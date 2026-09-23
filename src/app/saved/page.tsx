"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2, Sparkles, BookmarkCheck } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";
import { Badge } from "@/components/ui/badge";
import { DecorativePageHeader } from "@/components/decorative/page-header";

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
    <div className="flex flex-col">
      <div className="container mx-auto px-4 pt-8 md:pt-12 max-w-3xl">
        <DecorativePageHeader
          badge="Revision • Bookmarks"
          title="Saved"
          titleHighlight="Items"
          description="Chapters, study materials, and papers you saved for quick revision — all in one decorative shelf."
          variant="primary"
          actions={
            <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
              <BookmarkCheck className="h-3.5 w-3.5" /> {items.length} saved
            </Badge>
          }
        />
      </div>

      <div className="container mx-auto px-4 max-w-3xl">
        <div className="va-divider-dots my-6"><span /></div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.015] to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4 pb-12 max-w-3xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/20" />
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Your Shelf</Badge>
            <span className="h-px w-8 bg-gradient-to-r from-primary/20 to-transparent" />
          </div>

      {authError ? (
        <div className="va-card-hover rounded-[1.5rem] border border-primary/10 bg-white shadow-sm p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bookmark className="h-6 w-6" /></div>
          <p className="text-muted-foreground mt-3">
            Please{" "}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              log in
            </Link>{" "}
            to view your saved items.
          </p>
        </div>
      ) : loading ? (
        <div className="grid gap-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-[1.25rem] bg-muted animate-pulse border border-primary/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="va-card-hover rounded-[1.5rem] border border-primary/10 bg-white shadow-sm p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bookmark className="h-6 w-6" /></div>
          <p className="font-semibold mt-3">Nothing saved yet</p>
          <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
          <p className="text-muted-foreground text-sm mt-2">
            You have no saved items yet. Use the “Save” button on chapters, study
            materials, and papers to keep them here for quick revision.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((b) => (
            <li
              key={b.id}
              className="va-card-hover group relative overflow-hidden flex items-center justify-between gap-4 rounded-[1.25rem] border border-primary/5 bg-white p-4 shadow-sm hover:shadow-lg hover:border-primary/10"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="min-w-0 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"><Bookmark className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-primary font-semibold">
                    <span className="h-1 w-1 rounded-full bg-primary" />{TYPE_LABEL[b.type] ?? b.type}
                  </span>
                  <Link
                    href={b.url}
                    className="block truncate text-sm font-medium hover:text-primary hover:underline transition-colors"
                  >
                    {b.title}
                  </Link>
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(b.id)}
                aria-label="Remove"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-destructive hover:border-destructive/20 hover:bg-destructive/5"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
        </div>
      </div>
    </div>
  );
}
