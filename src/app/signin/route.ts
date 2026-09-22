import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Alias: /login is the canonical sign-in page (see `pages.signIn` in
// src/lib/auth.ts). /signin exists so typed-in URLs, old bookmarks and
// external links land on the right page instead of a 404.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}
