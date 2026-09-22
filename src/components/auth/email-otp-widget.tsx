"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCsrfToken } from "@/lib/csrf-client";
import { BadgeCheck, Loader2, MailCheck } from "lucide-react";

// P1: optional email-OTP verification widget for signup.
// Verifies SIGNUP_EMAIL OTP and returns a single-use verificationToken
// that the register call sends as `emailVerificationToken`.
export function EmailOtpWidget({
  email,
  onVerified,
  disabled,
}: {
  email: string;
  onVerified: (token: string) => void;
  disabled?: boolean;
}) {
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "sent" | "done">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function request() {
    setError(null);
    if (!validEmail) {
      setError("Enter a valid email first.");
      return;
    }
    setLoading(true);
    try {
      const csrf = await getCsrfToken();
      const res = await fetch("/api/auth/signup/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send OTP.");
        return;
      }
      setStep("sent");
      // Dev-only: surface code when the API returns it.
      if (data.devCode && process.env.NODE_ENV !== "production") {
        setCode(data.devCode);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError(null);
    setLoading(true);
    try {
      const csrf = await getCsrfToken();
      const res = await fetch("/api/auth/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Invalid OTP.");
        return;
      }
      setToken(data.verificationToken);
      setStep("done");
      onVerified(data.verificationToken);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done" && token) {
    return (
      <p className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
        <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        Email verified — your account will be marked verified.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.03] p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium">
        <MailCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        Verify email <span className="font-normal text-muted-foreground">(optional, recommended)</span>
      </p>
      {step === "idle" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={disabled || loading || !validEmail}
          onClick={request}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
          Send OTP to email
        </Button>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="space-y-1">
            <Label htmlFor="email-otp">6-digit OTP</Label>
            <Input
              id="email-otp"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              disabled={disabled || loading}
              aria-describedby="email-otp-hint"
            />
            <p id="email-otp-hint" className="text-[11px] text-muted-foreground">
              Check the server console in dev, or your inbox when email is configured.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={disabled || loading || code.length !== 6} onClick={verify}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
              Verify
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={disabled || loading} onClick={request}>
              Resend
            </Button>
          </div>
        </div>
      )}
      {error ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
