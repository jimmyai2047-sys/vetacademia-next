import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/reset-token";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    const base = { success: true };
    if (user) {
      const token = signResetToken(user.email);
      const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
      return NextResponse.json({ ...base, resetUrl });
    }
    return NextResponse.json(base);
  } catch (error) {
    console.error("Mobile forgot password error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
