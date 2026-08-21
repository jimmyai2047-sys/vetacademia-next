import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const enquirySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  email: z.string().email("Invalid email address"),
  studentMobile: z
    .string()
    .min(10, "Enter a valid mobile number")
    .max(15)
    .optional()
    .or(z.literal("")),
  parentMobile: z.string().max(15).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  programme: z
    .enum(["AHDP", "B.V.Sc & A.H.", "M.V.Sc", "Ph.D", "Other"])
    .optional(),
  yearOrSemester: z.string().max(50).optional().or(z.literal("")),
  qualification: z.string().max(100).optional().or(z.literal("")),
  percentage: z.string().max(20).optional().or(z.literal("")),
  passingYear: z.string().max(10).optional().or(z.literal("")),
  category: z
    .enum(["GEN", "EWS", "OBC", "MBC", "SC", "ST", "Others"])
    .optional(),
  tsp: z.enum(["TSP", "Non-TSP"]).optional(),
  message: z.string().max(1000).optional().or(z.literal("")),
});

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const rl = rateLimit(`admission:${clientIp(req)}`, 8, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const data = enquirySchema.parse(body);

    const enquiry = await prisma.enquiry.create({
      data: {
        fullName: data.fullName.trim(),
        fatherName: data.fatherName?.trim() || null,
        motherName: data.motherName?.trim() || null,
        dob: data.dob?.trim() || null,
        gender: data.gender || null,
        email: data.email.trim().toLowerCase(),
        studentMobile: data.studentMobile?.trim() || null,
        parentMobile: data.parentMobile?.trim() || null,
        address: data.address?.trim() || null,
        programme: data.programme || null,
        yearOrSemester: data.yearOrSemester?.trim() || null,
        qualification: data.qualification?.trim() || null,
        percentage: data.percentage?.trim() || null,
        passingYear: data.passingYear?.trim() || null,
        category: data.category || null,
        tsp: data.tsp || null,
        message: data.message?.trim() || null,
      },
    });

    return NextResponse.json(
      { message: "Admission enquiry submitted successfully", id: enquiry.id },
      { status: 201 }
    );
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
    console.error("Admission enquiry error:", error);
    return NextResponse.json(
      { error: "Could not submit your enquiry. Please try again later." },
      { status: 500 }
    );
  }
}
