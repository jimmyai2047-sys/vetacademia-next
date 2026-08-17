"use client";

import { CSRF_COOKIE } from "./csrf-constants";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(^|; )" + name + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[2]) : null;
}

// Returns a CSRF token, obtaining a fresh one from /api/csrf if the cookie
// is missing. The same value is sent both as the cookie (automatic) and the
// x-csrf-token header so the server can verify they match.
export async function getCsrfToken(): Promise<string> {
  let token = readCookie(CSRF_COOKIE);
  if (!token) {
    await fetch("/api/csrf", { method: "GET" });
    token = readCookie(CSRF_COOKIE);
  }
  if (!token) throw new Error("Unable to obtain CSRF token");
  return token;
}
