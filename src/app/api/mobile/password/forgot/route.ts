import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/reset-token";
import { sendEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const rl = await rateLimit(`mobile-forgot:${clientIp(req)}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }
    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    const base = { success: true };
    if (user) {
      const token = signResetToken(user.email, user.password);
      const resetUrl = `${env.NEXTAUTH_URL}/reset-password?token=${token}`;
      // Surface the link only outside prod so the flow stays testable
      // without an email provider (matches web forgot-password).
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ ...base, resetUrl });
      }
      // Fail-soft: sendEmail never throws; response identical either way.
      await sendEmail({
        to: user.email,
        subject: "Reset your VetAcademia password",
        text: `Reset your VetAcademia password with this link (valid 30 minutes): ${resetUrl}\nIf you didn't ask for this, just ignore this email.`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111"><h2 style="margin:0 0 12px">Reset your password</h2><p style="color:#555">Use this link within 30 minutes (or paste the token into the app's reset screen).</p><p><a href="${resetUrl}" style="display:inline-block;background:#005f48;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold">Reset password</a></p><p style="color:#888;font-size:12px">Token: ${token}</p></div>`,
      });
    }
    return NextResponse.json(base);
  } catch (error) {
    console.error("Mobile forgot password error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
