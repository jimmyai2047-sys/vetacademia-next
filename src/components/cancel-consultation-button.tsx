"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function CancelConsultationButton({
  id,
}: {
  id: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onCancel() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/consultations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not cancel");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        disabled={loading}
      >
        {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
        Cancel
      </Button>
    </div>
  );
}
