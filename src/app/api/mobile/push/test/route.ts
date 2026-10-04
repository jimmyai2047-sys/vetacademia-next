import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { sendPushToUser } from "@/lib/push";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const rl = await rateLimit(`push-test:${clientIp(req)}`, 5, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    const userId = verifyToken(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await sendPushToUser(
      userId,
      "VetAcademia",
      "🔔 Test notification — push is working!"
    );
    return NextResponse.json(res);
  } catch (error) {
    console.error("Push test error:", error);
    return NextResponse.json({ error: "Failed to send test notification" }, { status: 500 });
  }
}
