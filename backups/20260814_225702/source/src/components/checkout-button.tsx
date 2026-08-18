"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function CheckoutButton({
  planSlug,
  amount,
  alreadyEnrolled,
}: {
  planSlug: string;
  amount: number;
  alreadyEnrolled?: boolean;
}) {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });

      if (res.status === 401) {
        router.push(
          `/login?redirect=${encodeURIComponent("/checkout?plan=" + planSlug)}`
        );
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start checkout");
        setLoading(false);
        return;
      }

      // TEST MODE: complete the payment immediately.
      const payRes = await fetch(`/api/purchase/${data.id}/pay`, {
        method: "POST",
      });
      if (!payRes.ok) {
        const d = await payRes.json().catch(() => ({}));
        setError(d.error || "Payment failed");
        setLoading(false);
        return;
      }

      router.push(
        `/pricing?success=1&plan=${encodeURIComponent(planSlug)}`
      );
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (alreadyEnrolled) {
    return (
      <p className="text-sm text-emerald-600 font-medium">
        You are already enrolled in this plan.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Button onClick={pay} disabled={loading || status === "loading"} size="lg" className="w-full">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {loading
          ? "Processing..."
          : `Pay Rs.${amount.toLocaleString("en-IN")} (Test)`}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground text-center">
        Test mode: no real charge is made. Razorpay will be enabled once
        activated.
      </p>
    </div>
  );
}
