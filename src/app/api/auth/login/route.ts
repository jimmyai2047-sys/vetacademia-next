import { NextResponse } from "next/server";

/**
 * DEPRECATED (P0 cleanup): this endpoint was never used by the web client.
 * Web login goes through NextAuth `signIn("credentials")` -> `src/lib/auth.ts`.
 * Keeping a second bcrypt-compare path doubles the attack surface and confused
 * debugging (it returns JSON but never creates a session).
 *
 * Returns 410 Gone so any stray caller migrates to NextAuth.
 * Mobile apps use `/api/mobile/auth/*` (token auth) instead.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Deprecated: use NextAuth credentials sign-in instead of POST /api/auth/login.",
    },
    { status: 410 }
  );
}
