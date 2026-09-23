"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CircleCheck } from "lucide-react";
import { getCsrfToken } from "@/lib/csrf-client";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";

// P0: single component (was ResetForm + ResetInner duplicating token/done state).
function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    // P0: unified policy (was 6, now 8 like signup).
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Missing reset token");
      return;
    }
    setLoading(true);
    try {
      const csrf = await getCsrfToken();
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not reset password");
        return;
      }
      setDone(true);
      // Hand off to login with a success banner after a short pause.
      timer.current = setTimeout(() => router.push("/login?reset=success"), 1200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="py-4 text-center text-sm text-destructive" role="alert">
        Missing or invalid reset link. Please request a new one from the{" "}
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          forgot password
        </Link>{" "}
        page.
      </p>
    );
  }

  if (done) {
    return (
      <p
        className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        role="status"
      >
        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Your password has been updated. Redirecting to sign in...{" "}
          <Link href="/login?reset=success" className="font-medium underline">
            Continue now
          </Link>
        </span>
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PasswordField
        id="reset-password"
        name="password"
        label="New password"
        autoComplete="new-password"
        autoFocus
        showStrength
        disabled={loading}
        value={password}
        onChange={setPassword}
      />
      <PasswordField
        id="reset-confirm"
        name="confirm"
        label="Confirm password"
        autoComplete="new-password"
        disabled={loading}
        value={confirm}
        onChange={setConfirm}
      />
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
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Lock className="h-4 w-4" aria-hidden="true" />
        )}
        {loading ? "Updating..." : "Update password"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Use at least {PASSWORD_MIN_LENGTH} characters. Links expire in 30 minutes.
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new password for your account"
      hindiSubtitle="अपने खाते के लिए नया पासवर्ड चुनें"
      footer={
        <Link href="/login" className="block text-center text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="mb-5 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>
      <Suspense fallback={null}>
        <ResetInner />
      </Suspense>
    </AuthShell>
  );
}
