"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { GraduationCap, Lock } from "lucide-react";
import { getCsrfToken } from "@/lib/csrf-client";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
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
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-center text-green-600">
        Your password has been updated.{" "}
        <Link href="/login" className="underline">
          Continue to sign in
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-[#005f48] shadow-md hover:shadow-lg" disabled={loading}>
        <Lock className="h-4 w-4" />
        {loading ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
          <CardTitle className="tracking-tight">Reset password</CardTitle>
          <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
          <CardDescription>
            Choose a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <ResetInner />
          </Suspense>
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

function ResetInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="text-sm text-center text-green-600">
        Your password has been updated.{" "}
        <Link href="/login" className="underline">
          Continue to sign in
        </Link>
        .
      </p>
    );
  }
  if (!token) {
    return (
      <p className="text-sm text-center text-red-600">
        Missing or invalid reset link.
      </p>
    );
  }
  return <ResetForm />;
}
