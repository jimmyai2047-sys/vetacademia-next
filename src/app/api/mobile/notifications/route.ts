import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/mobileAuth";

export async function GET(req: Request) {
  try {
    const userId = verifyToken(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await prisma.notification.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Notifications API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
