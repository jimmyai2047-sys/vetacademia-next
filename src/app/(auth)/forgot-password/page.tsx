"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CircleCheck } from "lucide-react";
import { getCsrfToken } from "@/lib/csrf-client";
import { AuthShell } from "@/components/auth/auth-shell";

function ForgotInner() {
  const params = useSearchParams();
  const redirect = params.get("redirect") || "";
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const csrf = await getCsrfToken();
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.resetUrl) setResetUrl(data.resetUrl);
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll help you reset your password"
      hindiSubtitle="अपना पासवर्ड रीसेट करें"
      footer={
        <Link href={loginHref} className="block text-center text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="mb-5 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your account email and we&apos;ll help you reset your password.
        </p>
      </div>

      {submitted ? (
        <div
          className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-800 dark:bg-emerald-950/40"
          role="status"
        >
          <p className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
            <CircleCheck className="h-4 w-4" aria-hidden="true" /> Request received
          </p>
          <p className="text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email.trim()}</span>,
            a reset link has been sent. Links expire in 30 minutes.
          </p>
          {resetUrl ? (
            <a
              href={resetUrl}
              className="block break-all font-medium text-primary hover:underline"
            >
              Open reset link (dev only)
            </a>
          ) : (
            <p className="text-muted-foreground">
              No email provider is configured yet — please contact support from the{" "}
              <Link href="/contact" className="font-medium text-primary hover:underline">
                contact page
              </Link>{" "}
              if you don&apos;t receive the link.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={loading}
              aria-invalid={error ? true : undefined}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-[#0284c7] shadow-md hover:shadow-lg"
            disabled={loading}
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            {loading ? "Sending..." : "Send reset link"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Reset links expire in 30 minutes and can be used once.
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotInner />
    </Suspense>
  );
}
