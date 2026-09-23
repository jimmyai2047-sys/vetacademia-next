"use client";

import { useEffect, useRef, useState } from "react";

export default function MobileCheckout() {
  const [status, setStatus] = useState("Preparing your payment…");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const token = q.get("token") || "";
    const plan = q.get("plan") || "";
    if (!token || !plan) {
      setError("Missing token or plan in URL.");
      setStatus("");
      return;
    }

    const begin = () => doPayment(token, plan, setStatus, setError);

    if (!(window as any).Razorpay) {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => {
        if (!started.current) {
          started.current = true;
          begin();
        }
      };
      s.onerror = () => setError("Failed to load payment gateway.");
      document.body.appendChild(s);
    } else if (!started.current) {
      started.current = true;
      begin();
    }
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-white via-primary/[0.03] to-white px-4">
      <div className="absolute inset-0 va-pattern-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#d4a843]/15 blur-3xl pointer-events-none" />
      <div className="va-card-hover relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white/80 backdrop-blur-xl shadow-xl p-8 text-center">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#0284c7] text-white font-bold shadow-md">VA</div>
        <h2 className="mt-4 text-xl font-bold tracking-tight">VetAcademia</h2>
        <div className="va-divider-dots my-4 max-w-[120px] mx-auto"><span /></div>
        {error ? (
          <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{status}</p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Complete payment in the popup. You can close this tab afterwards.
        </p>
      </div>
    </div>
  );
}

async function doPayment(
  token: string,
  plan: string,
  setStatus: (s: string) => void,
  setError: (e: string | null) => void
) {
  try {
    const res = await fetch("/api/mobile/payments/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planSlug: plan }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not start payment.");
      setStatus("");
      return;
    }

    setStatus("Opening payment gateway…");

    const rzp = new (window as any).Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      order_id: data.orderId,
      name: "VetAcademia",
      description: `Subscription: ${plan}`,
      handler: async (response: any) => {
        setStatus("Verifying payment…");
        try {
          const v = await fetch("/api/mobile/payments/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const vd = await v.json();
          if (vd.success) {
            setStatus("✅ Payment successful! You can close this page and return to the app.");
          } else {
            setError(vd.error || "Verification failed.");
            setStatus("");
          }
        } catch {
          setError("Verification failed.");
          setStatus("");
        }
      },
      modal: {
        ondismiss: () => setStatus("Payment cancelled. You can close this page."),
      },
    });
    rzp.open();
  } catch (e: any) {
    setError(e?.message || "Payment error.");
    setStatus("");
  }
}
