import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const userId = verifyToken(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    currentPassword?: string;
    newPassword?: string;
  };
  const currentPassword = body.currentPassword;
  const newPassword = body.newPassword;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { error: "Current and new password (min 6 chars) required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok)
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 }
    );

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
  return NextResponse.json({ success: true });
}
