import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/reset-token";
import { validateCsrf } from "@/lib/csrf";
import { rateLimit, clientIp } from "@/lib/rate-limit";

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
      const token = signResetToken(user.email);
      const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
      // In production the link would be emailed. Surface it only outside prod
      // so the flow is testable without an email provider.
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ ...base, resetUrl });
      }
    }

    return NextResponse.json(base);
  } catch (error) {
    console.error("[auth] forgot-password failed");
    if (process.env.NODE_ENV !== "production") console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
