import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  bookingSchema,
  buildConsultationNotes,
  createConsultation,
  listConsultations,
  ConsultationServiceError,
} from "@/lib/consultations-service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const consultations = await listConsultations({
      userId: session.user.id,
      role: session.user.role,
      orderBy: "slot",
    });

    return NextResponse.json(consultations);
  } catch (error) {
    console.error("Consultation GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const rl = await rateLimit(`consultations:${clientIp(req)}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = bookingSchema.parse(body);

    const slot = data.scheduledAt ? new Date(data.scheduledAt) : new Date();
    const notes = buildConsultationNotes({
      mode: data.mode,
      topic: data.topic,
      message: data.message,
    });

    const consultation = await createConsultation({
      studentId: session.user.id,
      expertId: data.expertId,
      slot,
      duration: 30,
      notes,
      requireAvailableExpert: false,
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
    if (error instanceof ConsultationServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Consultation POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
