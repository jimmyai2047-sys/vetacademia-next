"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CircleCheck } from "lucide-react";
import { startGuestSession } from "@/lib/guest";
import { getSafeRedirect } from "@/lib/auth-redirect";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { GoogleButton } from "@/components/auth/google-button";

const REMEMBER_KEY = "va_remember_email";

function SigninInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState("");
  // P1: remember-me prefill via lazy initializer (no setState-in-effect).
  const [email, setEmail] = useState(() => {
    try {
      if (typeof window === "undefined") return "";
      return localStorage.getItem(REMEMBER_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => {
    try {
      if (typeof window === "undefined") return true;
      return Boolean(localStorage.getItem(REMEMBER_KEY));
    } catch {
      return true;
    }
  });

  const redirect = getSafeRedirect(params, "/");
  const justRegistered = params.get("registered") === "true";
  const resetDone = params.get("reset") === "success";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    // P2 honeypot value (bots fill the hidden field; humans leave it empty).
    const company = (
      new FormData(e.currentTarget).get("company") as string | null
    )?.trim() ?? "";

    try {
      const res = await signIn("credentials", {
        email: normalizedEmail,
        password,
        company,
        redirect: false,
      });

      if (res?.error) {
        // P2: surface lockout/rate-limit distinctly, keep invalid generic (anti-enumeration).
        if (/too many attempts/i.test(res.error)) {
          setError(res.error);
        } else {
          setError("Invalid email or password");
        }
        return;
      }

      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, normalizedEmail);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        // ignore storage errors
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGuest() {
    setGuestLoading(true);
    setError("");
    try {
      const creds = await startGuestSession();
      const res = await signIn("credentials", {
        email: creds.email,
        password: creds.password,
        redirect: false,
      });
      if (res?.error) {
        setError("Guest login is unavailable right now.");
        return;
      }
      // P0: guests respect the original destination instead of hard "/".
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGuestLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your VetAcademia account"
      hindiSubtitle="वेटएकाडेमिया में वापस स्वागत है"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup?redirect=${encodeURIComponent(redirect)}`}
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <div className="mb-5 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your VetAcademia account
        </p>
      </div>

      {justRegistered ? (
        <p
          className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          role="status"
        >
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Account created — please sign in with your new credentials.
        </p>
      ) : null}
      {resetDone ? (
        <p
          className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          role="status"
        >
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Password updated — please sign in again.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* P2: honeypot — bots fill it, humans never see it. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        {error ? (
          <div
            className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            autoFocus
            disabled={isLoading || guestLoading}
            aria-invalid={error ? true : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <PasswordField
          id="login-password"
          name="password"
          label="Password"
          autoComplete="current-password"
          // No min-length here: legacy passwords shorter than 8 chars must
          // still be submittable so the server can validate them.
          minLength={1}
          disabled={isLoading || guestLoading}
          value={password}
          onChange={setPassword}
        />
        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-primary to-[#0284c7] shadow-md hover:shadow-lg"
          disabled={isLoading || guestLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <GoogleButton redirect={redirect} disabled={isLoading || guestLoading} />

        {/* P1: guest demoted to a subtle divider + ghost action. */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full rounded-xl text-muted-foreground hover:text-foreground"
          disabled={isLoading || guestLoading}
          onClick={handleGuest}
        >
          {guestLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Entering as Guest...
            </>
          ) : (
            "Continue as Guest"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function SigninPage() {
  return (
    <Suspense fallback={null}>
      <SigninInner />
    </Suspense>
  );
}
