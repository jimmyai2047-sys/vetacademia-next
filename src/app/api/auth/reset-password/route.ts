import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyResetToken, decodeResetTokenEmail } from "@/lib/reset-token";
import { validateCsrf } from "@/lib/csrf";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(1),
  // P0: unified with signup (8 chars). Was 6 — inconsistent policy.
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
    const rl = await rateLimit(`reset:${clientIp(req)}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const body = await req.json();
    const { token, password } = schema.parse(body);

    // Load the account first (case-insensitive — legacy rows may differ in
    // case), then verify the signature against its CURRENT password hash.
    // A successful reset changes the hash, killing all older links.
    const claimedEmail = decodeResetTokenEmail(token);
    if (!claimedEmail) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }
    const user = await prisma.user.findFirst({
      where: { email: { equals: claimedEmail, mode: "insensitive" } },
    });
    if (!user) {
      return NextResponse.json({ error: "Invalid reset link" }, { status: 400 });
    }
    const email = verifyResetToken(token, user.password);
    if (!email) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true });
    } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[auth] reset-password failed");
    if (process.env.NODE_ENV !== "production") console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
