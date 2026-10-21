"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { csrfFetch } from "@/lib/csrf-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import { History, Loader2, RotateCcw, ArchiveX } from "lucide-react";

type Revision = {
  id: string;
  chapterId: string | null;
  title: string;
  unitNumber: number;
  reason: string;
  createdBy: string | null;
  createdAt: string;
  orphaned: boolean;
  statusBefore: string | null;
};

const REASON_LABEL: Record<string, string> = {
  save: "Content save",
  title: "Title change",
  replace: "Removed by replace",
  restore: "Restored (snapshot before restore)",
  import: "Import",
};

function reasonLabel(r: Revision) {
  return REASON_LABEL[r.reason] || r.reason;
}

// Version history + restore (finding 9). Scoped to a subject so snapshots
// orphaned by a bulk replace ("removed by replace") are reachable too —
// restoring one re-creates the chapter as a new DRAFT.
export default function ChapterHistoryButton({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Revision[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [target, setTarget] = useState<Revision | null>(null);
  const loading = open && items === null && !error;

  useEffect(() => {
    if (!open || items !== null) return;
    let alive = true;
    fetch(`/api/admin/chapters/revisions?subjectId=${encodeURIComponent(subjectId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((d) => { if (alive) setItems(d); })
      .catch(() => { if (alive) setError("Could not load version history."); });
    return () => { alive = false; };
  }, [open, items, subjectId]);

  async function restore() {
    if (!target) return;
    setRestoring(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/admin/chapters/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId: target.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Restore failed");
        return;
      }
      setItems(null);
      router.refresh();
    } catch {
      setError("Restore failed");
    } finally {
      setRestoring(false);
      setTarget(null);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="inline-flex h-8 items-center gap-1.5 rounded-full border border-input bg-background px-3 text-xs font-medium hover:bg-muted">
          <History className="h-3.5 w-3.5" /> Version history
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version history</DialogTitle>
            <DialogDescription>
              Snapshots taken before every save, title change and replace. Restoring
              never destroys anything — the current text is snapshotted first.
            </DialogDescription>
          </DialogHeader>
          {loading && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
            </p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {items && items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No snapshots yet — the first save, title change or replace creates one.
            </p>
          )}
          {items && items.length > 0 && (
            <ul className="divide-y">
              {items.map((r) => (
                <li key={r.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {r.unitNumber ? `Unit ${r.unitNumber}: ` : ""}
                      {r.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span>{reasonLabel(r)}</span>
                      <span>·</span>
                      <span>{new Date(r.createdAt).toLocaleString("en-IN")}</span>
                      {r.createdBy && (<><span>·</span><span className="font-mono">{r.createdBy}</span></>)}
                      {r.statusBefore && (
                        <span className="rounded-full border px-1.5 py-0.5 text-[10px]">
                          was {r.statusBefore.toLowerCase()}
                        </span>
                      )}
                    </p>
                    {r.orphaned && (
                      <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] text-amber-800">
                        <ArchiveX className="h-3 w-3" /> chapter removed by replace — restore re-creates it as a draft
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 shrink-0"
                    onClick={() => setTarget(r)}
                  >
                    <RotateCcw className="h-3 w-3" /> Restore
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(o) => { if (!o) setTarget(null); }}
        title="Restore this snapshot?"
        description={
          target?.orphaned
            ? `The original chapter was removed by a replace. Restoring creates "${target.title}" as a new DRAFT chapter in this subject (students won't see it until you publish).`
            : target
              ? `Content returns to "${target.title}" as of ${new Date(target.createdAt).toLocaleString("en-IN")}. The current text is snapshotted first, so nothing is lost.`
              : ""
        }
        confirmLabel="Restore"
        variant="default"
        loading={restoring}
        onConfirm={restore}
      />
    </>
  );
}
