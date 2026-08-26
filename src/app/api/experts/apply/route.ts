import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const applySchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  specialization: z.string().min(2, "Specialization is required"),
  experienceYears: z.coerce.number().int().min(0).max(80).optional(),
  bio: z.string().optional(),
  certificateUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = applySchema.parse(body);

    const message = [
      "Expert Application",
      `Specialization: ${data.specialization}`,
      data.experienceYears != null
        ? `Experience: ${data.experienceYears} years`
        : null,
      data.bio ? `Bio: ${data.bio}` : null,
      data.certificateUrl ? `Certificate: ${data.certificateUrl}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const enquiry = await prisma.enquiry.create({
      data: {
        fullName: data.name,
        email: data.email,
        studentMobile: data.phone || null,
        programme: data.specialization,
        message,
        status: "NEW",
      },
    });

    return NextResponse.json(
      { id: enquiry.id, message: "Application received" },
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
    console.error("Expert apply error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
