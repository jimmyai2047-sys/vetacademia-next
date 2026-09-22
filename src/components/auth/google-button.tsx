"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// P1: Google OAuth button. Rendered only when the server reports the provider
// as enabled (GOOGLE_CLIENT_ID/SECRET set). Fetched at runtime so no rebuild
// is needed when keys are added.
export function GoogleButton({
  redirect,
  disabled,
}: {
  redirect: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/providers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setEnabled(Boolean(d.google));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!enabled) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full rounded-xl border-primary/15 bg-white hover:bg-primary/5"
      disabled={disabled || loading}
      onClick={() => {
        setLoading(true);
        signIn("google", { callbackUrl: redirect });
      }}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
          />
          <path
            fill="currentColor"
            opacity=".6"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path
            fill="currentColor"
            opacity=".4"
            d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
          />
          <path
            fill="currentColor"
            opacity=".8"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
      )}
      Continue with Google
    </Button>
  );
}
