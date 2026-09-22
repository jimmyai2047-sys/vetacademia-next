"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraduationCap, Mail } from "lucide-react";
import { getCsrfToken } from "@/lib/csrf-client";

export default function ForgotPasswordPage() {
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
        body: JSON.stringify({ email }),
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

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-b from-white via-primary/[0.03] to-white">
      <div className="absolute inset-0 va-pattern-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#d4a843]/15 blur-3xl pointer-events-none" />
      <Card className="va-card-hover relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white/90 backdrop-blur-xl shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <CardHeader className="text-center relative">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-[#005f48] flex items-center justify-center shadow-md">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="tracking-tight">Forgot password</CardTitle>
          <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
          <CardDescription>
            Enter your account email and we&apos;ll help you reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 p-4 text-sm space-y-1">
              <p className="font-medium text-green-700 dark:text-green-300">
                Request received
              </p>
              <p className="text-muted-foreground">
                If an account exists for <span className="font-medium">{email}</span>,
                a password reset link has been sent. In this environment an email
                provider is not configured, so the link is shown below for
                testing:
              </p>
              {resetUrl ? (
                <a
                  href={resetUrl}
                  className="block break-all font-medium text-primary hover:underline"
                >
                  Open reset link
                </a>
              ) : (
                <p className="text-muted-foreground">
                  Automated email reset is not enabled yet — please contact
                  support from the{" "}
                  <Link href="/contact" className="text-primary hover:underline">
                    contact page
                  </Link>{" "}
                  to reset your password.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <Button type="submit" className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-[#005f48] shadow-md hover:shadow-lg" disabled={loading}>
                <Mail className="h-4 w-4" />
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
