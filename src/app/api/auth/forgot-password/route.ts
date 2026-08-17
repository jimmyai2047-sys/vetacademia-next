import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/reset-token";
import { validateCsrf } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const { email } = await req.json().catch(() => ({}) as { email?: string });
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
