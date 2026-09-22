import { NextResponse } from "next/server";

// Must evaluate at request time: if this route were statically prerendered at
// build, `{ google: false }` would be baked in forever even after keys are added.
export const dynamic = "force-dynamic";

// P1: lets the client show/hide the Google button in sync with the server
// (server enables the provider only when GOOGLE_CLIENT_ID/SECRET are set).
export async function GET() {
  const google = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  return NextResponse.json({ google });
}
