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
    <div className="font-sans p-8 text-center mt-[20vh]">
      <h2 className="text-[#0a7ea4]">VetAcademia</h2>
      {error ? (
        <p className="text-[#c0392b]">{error}</p>
      ) : (
        <p className="text-[#555]">{status}</p>
      )}
      <p className="text-[#999] text-[13px] mt-4">
        Complete payment in the popup. You can close this tab afterwards.
      </p>
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
