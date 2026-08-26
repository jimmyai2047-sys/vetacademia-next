import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const userId = verifyToken(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
  };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!name || !email)
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );

  const clash = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
  });
  if (clash)
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, email },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json({ user });
}
