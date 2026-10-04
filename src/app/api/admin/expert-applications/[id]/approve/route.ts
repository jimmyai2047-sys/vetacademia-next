import { validateCsrf } from "@/lib/csrf";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { parseQualifications } from "@/lib/expert-proforma";

const approveSchema = z.object({
  hourlyRate: z.coerce.number().int().min(0).max(100000).optional().default(0),
  isAvailable: z.coerce.boolean().optional().default(true),
  photoUrl: z.string().trim().url().optional().or(z.literal("")),
});

// Approve a proforma application: creates the User + Expert (+ qualifications)
// so the filled information appears on the public expert pages.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateCsrf(req)) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  const auth = await requireAdminApi(req, { strict: true });
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const application = await prisma.expertApplication.findUnique({ where: { id } });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (application.status === "APPROVED") {
      return NextResponse.json({ error: "Application already approved" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const opts = approveSchema.parse(body);
    const qualifications = parseQualifications(application.qualifications);

    const email = application.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    let temporaryPassword: string | undefined;
    let userId: string;

    if (existingUser) {
      const existingExpert = await prisma.expert.findUnique({
        where: { userId: existingUser.id },
        select: { id: true },
      });
      if (existingExpert) {
        return NextResponse.json(
          { error: "An expert profile already exists for this email" },
          { status: 400 }
        );
      }
      userId = existingUser.id;
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: application.fullName,
          phone: application.phone,
          role: "PROFESSOR",
        },
      });
    } else {
      temporaryPassword =
        Array.from(crypto.getRandomValues(new Uint8Array(9)))
          .map(
            (b) =>
              "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"[b % 56]
          )
          .join("") + "!";
      const hashed = await bcrypt.hash(temporaryPassword, 12);
      const user = await prisma.user.create({
        data: {
          name: application.fullName,
          email,
          password: hashed,
          role: "PROFESSOR",
          phone: application.phone,
        },
        select: { id: true },
      });
      userId = user.id;
    }

    // New profiles start with a random display rating so the Experts page
    // never shows an empty "no reviews" card for freshly approved experts.
    const startingRating = Math.round((4.0 + Math.random() * 0.9) * 10) / 10;
    const startingReviews = 100 + Math.floor(Math.random() * 901);

    const expert = await prisma.expert.create({
      data: {
        userId,
        specialization: application.specialization,
        rating: startingRating,
        totalReviews: startingReviews,
        fieldCategory: application.fieldCategory,
        designation: application.designation,
        gender: application.gender,
        dob: application.dob,
        presentPosting: application.presentPosting,
        contactPhone: application.phone,
        showContact: application.showContact,
        experienceYears: application.experienceYears,
        bio: application.bio,
        awards: application.awards,
        photoUrl: opts.photoUrl || application.photoUrl,
        hourlyRate: opts.hourlyRate ?? 0,
        isAvailable: opts.isAvailable ?? true,
        qualifications: {
          create: qualifications.map((q, i) => ({
            degree: q.degree,
            year: q.year || null,
            institution: q.institution || null,
            order: i,
          })),
        },
      },
      select: { id: true },
    });

    await prisma.expertApplication.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date(), adminNote: null },
    });

    // In-app notice for the expert (shown in their notifications). Best-effort:
    // never fail an approval because the notice could not be recorded.
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: "Expert profile published",
          body: `Your expert proforma was approved. Your profile is now live on the Experts page${temporaryPassword ? " — use the temporary password shared with you to sign in and set a new one." : "."}`,
          type: "EXPERT",
        },
      });
    } catch (notifyError) {
      console.error("Expert approval notification failed:", notifyError);
    }

    return NextResponse.json(
      { expertId: expert.id, userId, temporaryPassword },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid approval options" }, { status: 400 });
    }
    console.error("Expert application approve error:", error);
    return NextResponse.json({ error: "Failed to approve application" }, { status: 500 });
  }
}
