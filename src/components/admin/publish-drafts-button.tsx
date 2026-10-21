"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { csrfFetch } from "@/lib/csrf-client";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import { Rocket } from "lucide-react";

// Finding 9: imported/added chapters land as DRAFT; this is the one-click,
// confirmed path to publish everything still unpublished in the subject.
export default function PublishDraftsButton({
  subjectId,
  draftCount,
}: {
  subjectId: string;
  draftCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (draftCount <= 0) return null;

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/admin/chapters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, status: "PUBLISHED", onlyDrafts: true }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Publish failed");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Publish failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        className="gap-1.5 rounded-full h-8 text-xs"
        onClick={() => setOpen(true)}
      >
        <Rocket className="h-3.5 w-3.5" /> Publish {draftCount} unpublished{" "}
        {draftCount === 1 ? "chapter" : "chapters"}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Publish ${draftCount} unpublished ${draftCount === 1 ? "chapter" : "chapters"}?`}
        description="Draft/review chapters in this subject become visible to students immediately (subject to their enrolment)."
        confirmLabel="Publish all"
        variant="default"
        loading={busy}
        onConfirm={publish}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </>
  );
}
