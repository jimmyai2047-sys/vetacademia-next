"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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
import { Loader2 } from "lucide-react";
import { startGuestSession } from "@/lib/guest";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
        return;
      }

      const redirect =
        new URLSearchParams(window.location.search).get("redirect") ||
        "/dashboard";
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
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGuestLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-b from-white via-primary/[0.03] to-white">
      <div className="absolute inset-0 va-pattern-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#d4a843]/15 blur-3xl pointer-events-none" />
      <Card className="va-card-hover relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white/90 backdrop-blur-xl shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <CardHeader className="text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-[#005f48] text-white font-bold text-xl flex items-center justify-center mx-auto mb-2 shadow-md">
            VA
          </div>
          <CardTitle className="text-2xl tracking-tight">Welcome Back</CardTitle>
          <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
          <CardDescription>
            Sign in to your VetAcademia account
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4 relative">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-end text-sm">
              <Link href="/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 relative">
            <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-primary to-[#005f48] shadow-md hover:shadow-lg" disabled={isLoading || guestLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border-primary/15 bg-white hover:bg-primary/5"
              disabled={isLoading || guestLoading}
              onClick={handleGuest}
            >
              {guestLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entering as Guest...
                </>
              ) : (
                "Continue as Guest"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
