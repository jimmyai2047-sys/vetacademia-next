import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const userId = verifyToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await req.json().catch(() => ({}))) as {
      token?: string;
      platform?: string;
    };
    if (!body.token)
      return NextResponse.json({ error: "token required" }, { status: 400 });

    await prisma.deviceToken.upsert({
      where: { userId_token: { userId, token: body.token } },
      update: { platform: body.platform || "ios" },
      create: {
        userId,
        token: body.token,
        platform: body.platform || "ios",
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Mobile push register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
