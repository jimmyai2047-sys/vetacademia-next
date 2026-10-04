import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mobileAuth";
import {
  createConsultation,
  listConsultations,
  ConsultationServiceError,
} from "@/lib/consultations-service";

export async function POST(req: Request) {
  try {
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
    if (!body.slot || isNaN(new Date(body.slot).getTime())) {
      return NextResponse.json({ error: "Valid slot required" }, { status: 400 });
    }

    const consultation = await createConsultation({
      studentId: userId,
      expertId: body.expertId,
      slot: new Date(body.slot),
      duration: body.duration,
      notes: body.notes || null,
      requireAvailableExpert: true,
    });
    return NextResponse.json({ consultation }, { status: 201 });
  } catch (error) {
    if (error instanceof ConsultationServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Mobile consultations POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const userId = verifyToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const consultations = await listConsultations({ userId, orderBy: "createdAt" });
    return NextResponse.json({ consultations });
  } catch (error) {
    console.error("Mobile consultations GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
