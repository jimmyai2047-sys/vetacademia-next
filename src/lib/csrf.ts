import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { CSRF_COOKIE, CSRF_HEADER } from "./csrf-constants";

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Attaches a fresh double-submit CSRF cookie to a response and returns the token.
export function setCsrfCookie(
  res: NextResponse,
  token: string = generateCsrfToken()
): string {
  res.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 2,
  });
  return token;
}

// Double-submit verification: the header token must equal the cookie token.
// An attacker cannot read the cookie cross-origin nor forge the matching
// header, so cross-site requests fail this check.
export function validateCsrf(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken) return false;

  const a = Buffer.from(cookieToken);
  const b = Buffer.from(headerToken);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
