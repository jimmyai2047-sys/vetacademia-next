import { NextResponse } from "next/server";
import { setCsrfCookie } from "@/lib/csrf";

export const dynamic = "force-dynamic";

// Issues a double-submit CSRF cookie. Client forms call this (or read the
// cookie lazily) before POSTing to the auth endpoints.
export async function GET() {
  const res = NextResponse.json({ ok: true });
  setCsrfCookie(res);
  return res;
}
