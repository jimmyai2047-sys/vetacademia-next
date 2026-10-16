import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/reset-token";
import { sendEmail } from "@/lib/email";
import { validateCsrf } from "@/lib/csrf";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
    const rl = await rateLimit(`forgot:${clientIp(req)}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const { email: rawEmail } = await req.json().catch(() => ({}) as { email?: string });
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    // Always return the same response to avoid account enumeration.
    const base = { success: true };

    if (user) {
      // Token is bound to the current password hash (single-use: any reset
      // invalidates previously issued links — see lib/reset-token.ts).
      const token = signResetToken(user.email, user.password);
      const resetUrl = `${env.NEXTAUTH_URL}/reset-password?token=${token}`;
      // In production the link is emailed. Surface it only outside prod
      // so the flow is testable without an email provider.
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ ...base, resetUrl });
      }
      // Fail-soft by design: sendEmail never throws, and the response stays
      // identical either way (no account enumeration). Delivery requires
      // RESEND_API_KEY in the deployed env.
      await sendEmail({
        to: user.email,
        subject: "Reset your VetAcademia password",
        text: `Reset your VetAcademia password with this link (valid 30 minutes): ${resetUrl}\nIf you didn't ask for this, just ignore this email.`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111"><h2 style="margin:0 0 12px">Reset your password</h2><p style="color:#555">Click the button below within 30 minutes. If you didn't ask for this, just ignore this email.</p><p><a href="${resetUrl}" style="display:inline-block;background:#005f48;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold">Reset password</a></p><p style="color:#888;font-size:12px">Or paste this link: ${resetUrl}</p></div>`,
      });
    }

    return NextResponse.json(base);
  } catch (error) {
    console.error("[auth] forgot-password failed");
    if (process.env.NODE_ENV !== "production") console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
