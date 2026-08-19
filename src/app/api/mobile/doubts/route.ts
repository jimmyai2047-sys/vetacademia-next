import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/mobileAuth";

export async function GET(req: Request) {
  const userId = verifyToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const doubts = await prisma.doubt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(doubts);
  } catch (error) {
    console.error("Mobile doubts GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = verifyToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { subject, question } = await req.json();
    if (!question || !String(question).trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }
    const doubt = await prisma.doubt.create({
      data: {
        userId,
        subject: subject ? String(subject) : null,
        question: String(question).trim(),
        status: "OPEN",
      },
    });
    return NextResponse.json(doubt, { status: 201 });
  } catch (error) {
    console.error("Mobile doubts POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
