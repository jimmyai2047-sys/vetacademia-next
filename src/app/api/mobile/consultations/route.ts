import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const userId = verifyToken(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    expertId?: string;
    slot?: string;
    duration?: number;
    notes?: string;
  };
  if (!body.expertId || !body.slot) {
    return NextResponse.json({ error: "expertId and slot required" }, { status: 400 });
  }

  const expert = await prisma.expert.findUnique({ where: { id: body.expertId } });
  if (!expert || !expert.isAvailable) {
    return NextResponse.json({ error: "Expert not available" }, { status: 404 });
  }

  const consultation = await prisma.consultation.create({
    data: {
      studentId: userId,
      expertId: body.expertId,
      slot: new Date(body.slot),
      duration: body.duration || 30,
      notes: body.notes || null,
      status: "PENDING",
    },
  });
  return NextResponse.json({ consultation }, { status: 201 });
}

export async function GET(req: Request) {
  const userId = verifyToken(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const consultations = await prisma.consultation.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
    include: { expert: { include: { user: { select: { name: true } } } } },
  });
  return NextResponse.json({ consultations });
}
