import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const rl = await rateLimit(`push-unregister:${clientIp(req)}`, 5, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    const userId = verifyToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await req.json().catch(() => ({}))) as { token?: string };
    if (!body.token)
      return NextResponse.json({ error: "token required" }, { status: 400 });

    await prisma.deviceToken.deleteMany({ where: { userId, token: body.token } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push unregister error:", error);
    return NextResponse.json({ error: "Failed to unregister device" }, { status: 500 });
  }
}
