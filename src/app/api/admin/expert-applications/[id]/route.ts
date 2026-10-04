import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { expertProformaSchema } from "@/lib/expert-proforma";

// Admin correction of a received proforma. Only PENDING applications can be
// edited — once approved, the Expert profile itself is the record to edit.
// The full proforma is validated so the application stays publishable.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi(req, { strict: true });
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const application = await prisma.expertApplication.findUnique({ where: { id } });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (application.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending applications can be edited. Edit the expert profile instead." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = expertProformaSchema.parse(body);

    if (data.email !== application.email) {
      const clash = await prisma.expertApplication.findFirst({
        where: { email: data.email, status: "PENDING", id: { not: id } },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json(
          { error: "Another pending application already uses this email" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.expertApplication.update({
      where: { id },
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
      },
    });

    return NextResponse.json(updated);
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
    console.error("Expert application update error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
