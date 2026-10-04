import { NextResponse, NextRequest } from "next/server";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import bcrypt from "bcryptjs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const { id } = await params;
    const expert = await prisma.expert.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });
    if (!expert) {
      return NextResponse.json({ error: "Expert not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const specialization = (body.specialization || "").trim();
    const hourlyRate = Number(body.hourlyRate) || 0;

    if (!name || !email || !specialization) {
      return NextResponse.json(
        { error: "Name, email and specialization are required" },
        { status: 400 }
      );
    }

    if (email !== expert.user.email) {
      const conflict = await prisma.user.findUnique({ where: { email } });
      if (conflict && conflict.id !== expert.userId) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 400 }
        );
      }
    }

    await prisma.user.update({
      where: { id: expert.userId },
      data: {
        name,
        email,
        ...(body.password
          ? { password: await bcrypt.hash(String(body.password), 12) }
          : {}),
      },
    });

    await prisma.expert.update({
      where: { id },
      data: {
        specialization,
        fieldCategory: body.fieldCategory || null,
        designation: body.designation || null,
        gender: body.gender || null,
        dob: body.dob || null,
        presentPosting: body.presentPosting || null,
        contactPhone: body.contactPhone || null,
        showContact: body.showContact === true,
        experienceYears:
          body.experienceYears === "" || body.experienceYears == null
            ? null
            : Number(body.experienceYears) || null,
        bio: body.bio || null,
        awards: body.awards || null,
        photoUrl: body.photoUrl || null,
        hourlyRate,
        isAvailable: body.isAvailable !== false,
      },
    });

    if (Array.isArray(body.qualifications)) {
      const quals = body.qualifications
        .filter(
          (q: unknown) =>
            q && typeof (q as { degree?: unknown }).degree === "string" && String((q as { degree: string }).degree).trim()
        )
        .slice(0, 10)
        .map((q: { degree: string; year?: string; institution?: string }, i: number) => ({
          degree: String(q.degree).slice(0, 150),
          year: q.year ? String(q.year).slice(0, 10) : null,
          institution: q.institution ? String(q.institution).slice(0, 200) : null,
          order: i,
        }));
      await prisma.expertQualification.deleteMany({ where: { expertId: id } });
      if (quals.length) {
        await prisma.expertQualification.createMany({
          data: quals.map((q: { degree: string; year: string | null; institution: string | null; order: number }) => ({
            expertId: id,
            ...q,
          })),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Experts PUT error:", error);
    return NextResponse.json({ error: "Failed to update expert" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const { id } = await params;
    const expert = await prisma.expert.findUnique({ where: { id } });
    if (!expert) {
      return NextResponse.json({ error: "Expert not found" }, { status: 404 });
    }

    // Deleting the user cascades to the expert profile
    await prisma.user.delete({ where: { id: expert.userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Experts DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete expert" }, { status: 500 });
  }
}
