import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const userId = verifyToken(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { token?: string };
  if (!body.token)
    return NextResponse.json({ error: "token required" }, { status: 400 });

  await prisma.deviceToken.deleteMany({ where: { userId, token: body.token } });
  return NextResponse.json({ ok: true });
}
