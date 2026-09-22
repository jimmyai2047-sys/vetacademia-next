import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCsrf } from "@/lib/csrf";

// P0: post-signup avatar linking. Signup itself no longer uploads anonymously
// (the old flow hit 401 because /api/upload/avatar requires a session).
// Flow: register -> signIn -> upload via /api/upload/avatar (authed) ->
// PATCH here with the returned blob URL.
const schema = z.object({
  url: z.string().trim().min(1, "Avatar URL required").max(1000),
});

export async function PATCH(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const { url } = schema.parse(body);
    // Only allow our own Blob store or relative paths.
    const ok =
      url.startsWith("/") || url.includes("blob.vercel-storage.com");
    if (!ok) {
      return NextResponse.json({ error: "Invalid avatar URL" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: url },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("[auth] avatar link failed");
    if (process.env.NODE_ENV !== "production") console.error(error);
    return NextResponse.json({ error: "Failed to update avatar" }, { status: 500 });
  }
}
