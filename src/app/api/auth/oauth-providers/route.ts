import { NextResponse } from "next/server";

// Must evaluate at request time: if this route were statically prerendered at
// build, `{ google: false }` would be baked in forever even after keys are added.
export const dynamic = "force-dynamic";

// P1: lets the client show/hide the Google button in sync with the server
// (server enables the provider only when GOOGLE_CLIENT_ID/SECRET are set).
//
// NOTE: this must NOT live at `/api/auth/providers` — that path is reserved
// by NextAuth (its `[...nextauth]` catch-all serves the provider map there,
// which `signIn()`/`getProviders()` depend on). A custom route at that path
// shadows NextAuth and breaks every credentials sign-in (the client bounces
// to the default `/api/auth/signin` page). Hence the distinct name.
export async function GET() {
  const google = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  return NextResponse.json({ google });
}
