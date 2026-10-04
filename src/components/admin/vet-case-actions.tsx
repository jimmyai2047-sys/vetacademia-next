"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/csrf-client";

const STATUSES = ["OPEN", "REVIEWED", "CLOSED"] as const;

export default function VetCaseActions({ id, status }: { id: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [busy, setBusy] = useState(false);

  async function setStatus(next: string) {
    if (next === current || busy) return;
    setBusy(true);
    try {
      const res = await csrfFetch("/api/admin/vet-cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      if (res.ok) setCurrent(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUSES.map((s) => (
        <Button
          key={s}
          size="sm"
          variant={current === s ? "default" : "outline"}
          className="rounded-full text-xs min-h-[36px]"
          disabled={busy}
          onClick={() => setStatus(s)}
        >
          {s.charAt(0) + s.slice(1).toLowerCase()}
        </Button>
      ))}
    </div>
  );
}
