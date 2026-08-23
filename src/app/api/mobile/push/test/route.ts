import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { sendPushToUser } from "@/lib/push";

export async function POST(req: Request) {
  const userId = verifyToken(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await sendPushToUser(
    userId,
    "VetAcademia",
    "🔔 Test notification — push is working!"
  );
  return NextResponse.json(res);
}
