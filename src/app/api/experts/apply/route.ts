import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { expertProformaSchema } from "@/lib/expert-proforma";

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

// Public expert proforma (circulated link: /experts/apply). Anonymous
// submissions are stored as ExpertApplication rows with status PENDING —
// nothing appears on the expert pages until an admin approves them.
export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }
    const rl = await rateLimit(`experts-apply:${clientIp(req)}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
    const body = await req.json();
    const data = expertProformaSchema.parse(body);

    const existingPending = await prisma.expertApplication.findFirst({
      where: { email: data.email, status: "PENDING" },
      select: { id: true },
    });
    if (existingPending) {
      return NextResponse.json(
        {
          error:
            "An application with this email is already under review. Our team will contact you once it is approved.",
        },
        { status: 409 }
      );
    }

    const application = await prisma.expertApplication.create({
      data: {
        fullName: data.fullName,
        designation: data.designation,
        gender: data.gender || null,
        dob: data.dob || null,
        email: data.email,
        phone: data.phone,
        presentPosting: data.presentPosting,
        specialization: data.specialization,
        fieldCategory: data.fieldCategory || null,
        experienceYears: data.experienceYears ?? null,
        bio: data.bio || null,
        awards: data.awards || null,
        photoUrl: data.photoUrl || null,
        certificateUrl: data.certificateUrl || null,
        qualifications: JSON.stringify(
          data.qualifications.map((q) => ({
            degree: q.degree,
            year: q.year,
            institution: q.institution || "",
          }))
        ),
        showContact: data.showContact ?? false,
        status: "PENDING",
      },
      select: { id: true },
    });

    return NextResponse.json(
      {
        id: application.id,
        message:
          "Proforma received. It will appear on the Experts page after admin approval.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues
        .map((i) => `${i.path.join(".") || "field"}: ${i.message}`)
        .filter(Boolean)
        .join("; ");
      return NextResponse.json(
        { error: message || "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Expert proforma apply error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
