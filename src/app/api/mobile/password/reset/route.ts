import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyResetToken } from "@/lib/reset-token";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      token?: string;
      password?: string;
    };
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token || password.length < 6) {
      return NextResponse.json(
        { error: "Token and password (min 6 chars) required" },
        { status: 400 }
      );
    }

    const email = verifyResetToken(token);
    if (!email)
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: "Invalid reset link" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mobile reset password error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
