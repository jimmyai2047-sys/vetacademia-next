import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/reset-token";
import { rateLimit, clientIp } from "@/lib/rate-limit";

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

    const user = await prisma.user.findUnique({ where: { email } });
    const base = { success: true };
    if (user) {
      const token = signResetToken(user.email);
      // Surface the link only outside prod so the flow stays testable
      // without an email provider (matches web forgot-password).
      if (process.env.NODE_ENV !== "production") {
        const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
        return NextResponse.json({ ...base, resetUrl });
      }
    }
    return NextResponse.json(base);
  } catch (error) {
    console.error("Mobile forgot password error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
