import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCsrf } from "@/lib/csrf";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const MODES = ["VIDEO", "CHAT", "CALL"] as const;

const bookingSchema = z.object({
  expertId: z.string().min(1, "Expert is required"),
  scheduledAt: z.string().optional(),
  mode: z.enum(MODES).default("CHAT"),
  topic: z.string().optional(),
  message: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const consultations = await prisma.consultation.findMany({
    where: { studentId: session.user.id },
    include: {
      expert: { include: { user: { select: { name: true } } } },
    },
    orderBy: { slot: "desc" },
  });

  return NextResponse.json(consultations);
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const rl = rateLimit(`consultations:${clientIp(req)}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = bookingSchema.parse(body);

    const expert = await prisma.expert.findUnique({
      where: { id: data.expertId },
      select: { id: true },
    });
    if (!expert) {
      return NextResponse.json({ error: "Expert not found" }, { status: 404 });
    }

    const slot = data.scheduledAt ? new Date(data.scheduledAt) : new Date();
    const notes = [
      `Mode: ${data.mode}`,
      data.topic ? `Topic: ${data.topic}` : null,
      data.message || null,
    ]
      .filter(Boolean)
      .join("\n");

    const consultation = await prisma.consultation.create({
      data: {
        studentId: session.user.id,
        expertId: data.expertId,
        slot,
        duration: 30,
        status: "PENDING",
        notes: notes || null,
      },
    });

    return NextResponse.json({ id: consultation.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues
        .map((i) => i.message)
        .filter(Boolean)
        .join("; ");
      return NextResponse.json(
        { error: message || "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Consultation POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
