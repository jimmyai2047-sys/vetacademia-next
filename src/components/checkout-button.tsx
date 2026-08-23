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
  reportId,
  alreadyUnlocked,
}: {
  planSlug?: string;
  amount: number;
  alreadyEnrolled?: boolean;
  reportId?: string;
  alreadyUnlocked?: boolean;
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
        body: JSON.stringify(reportId ? { projectReportId: reportId } : { planSlug }),
      });

      if (res.status === 401) {
        const redirectTo = reportId
          ? `/checkout?report=${reportId}`
          : `/checkout?plan=${planSlug}`;
        router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
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

      if (reportId) {
        router.push(`/farmers?unlocked=1`);
      } else {
        router.push(
          `/pricing?success=1&plan=${encodeURIComponent(planSlug || "")}`
        );
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (alreadyEnrolled || alreadyUnlocked) {
    return (
      <p className="text-sm text-emerald-600 font-medium">
        {alreadyUnlocked
          ? "You have already unlocked this report."
          : "You are already enrolled in this plan."}
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
          : `Pay Rs.${amount.toLocaleString("en-IN")}`}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground text-center">
        Secure payment powered by Razorpay. Your payment information is encrypted.
      </p>
    </div>
  );
}
