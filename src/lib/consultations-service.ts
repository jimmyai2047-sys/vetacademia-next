import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isExpertRole } from "@/lib/roles";

// Shared validation + prisma logic for web + mobile consultation routes.
// Routes remain thin adapters: they keep their own auth (session vs Bearer),
// CSRF/rate-limit, and exact response shapes/status codes.

export const CONSULTATION_MODES = ["VIDEO", "CHAT", "CALL"] as const;

// Zod schema previously inline in src/app/api/consultations/route.ts (web).
// Moved here so both routes share one definition; web still parses with it.
export const bookingSchema = z.object({
  expertId: z.string().min(1, "Expert is required"),
  scheduledAt: z.string().optional(),
  mode: z.enum(CONSULTATION_MODES).default("CHAT"),
  topic: z.string().optional(),
  message: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export type ConsultationListOrder = "slot" | "createdAt";

export type ListConsultationsArgs = {
  userId: string;
  role?: string | null;
  orderBy?: ConsultationListOrder;
};

// Shared list: role-aware but backward compatible.
// - Expert roles resolve their Expert profile and list incoming consultations
//   by expertId (mirrors src/app/consultations/page.tsx server logic).
// - Everyone else (STUDENT/mobile callers) lists by studentId.
// - orderBy preserves each route's current ordering: web = slot desc,
//   mobile = createdAt desc.
export async function listConsultations({
  userId,
  role,
  orderBy = "slot",
}: ListConsultationsArgs) {
  const order =
    orderBy === "createdAt" ? { createdAt: "desc" as const } : { slot: "desc" as const };

  if (role && isExpertRole(role)) {
    const expert = await prisma.expert.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (expert) {
      return prisma.consultation.findMany({
        where: { expertId: expert.id },
        include: {
          expert: { include: { user: { select: { name: true } } } },
        },
        orderBy: order,
      });
    }
  }

  return prisma.consultation.findMany({
    where: { studentId: userId },
    include: {
      expert: { include: { user: { select: { name: true } } } },
    },
    orderBy: order,
  });
}

// Mobile clamp previously inline in src/app/api/mobile/consultations/route.ts.
// Kept here so both callers share it (web passes fixed 30, mobile passes raw).
export function clampConsultationDuration(raw?: unknown): number {
  return Math.min(Math.max(Number(raw) || 30, 15), 120);
}

// Notes builder previously inline in the web POST route
// (Mode: / Topic: / message joined by newline).
export function buildConsultationNotes(input: {
  mode?: string;
  topic?: string;
  message?: string;
}): string | null {
  const notes = [
    `Mode: ${input.mode ?? "CHAT"}`,
    input.topic ? `Topic: ${input.topic}` : null,
    input.message || null,
  ]
    .filter(Boolean)
    .join("\n");
  return notes || null;
}

export class ConsultationServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ConsultationServiceError";
    this.status = status;
  }
}

export type CreateConsultationArgs = {
  studentId: string;
  expertId: string;
  slot: Date | string;
  duration?: number;
  notes?: string | null;
  // Web allows booking unavailable experts ("Expert not found" only when the
  // row is missing); mobile requires isAvailable ("Expert not available").
  requireAvailableExpert?: boolean;
};

// Shared create: validates slot + expert, clamps duration, inserts PENDING row.
export async function createConsultation({
  studentId,
  expertId,
  slot,
  duration,
  notes,
  requireAvailableExpert = false,
}: CreateConsultationArgs) {
  if (!expertId) {
    throw new ConsultationServiceError(
      requireAvailableExpert ? "expertId and slot required" : "Expert is required",
      400
    );
  }

  const slotDate = slot instanceof Date ? slot : new Date(slot);
  if (isNaN(slotDate.getTime())) {
    throw new ConsultationServiceError("Valid slot required", 400);
  }

  const expert = await prisma.expert.findUnique({
    where: { id: expertId },
  });
  if (!expert || (requireAvailableExpert && !expert.isAvailable)) {
    throw new ConsultationServiceError(
      requireAvailableExpert ? "Expert not available" : "Expert not found",
      404
    );
  }

  return prisma.consultation.create({
    data: {
      studentId,
      expertId,
      slot: slotDate,
      duration: clampConsultationDuration(duration),
      status: "PENDING",
      notes: notes ?? null,
    },
  });
}
