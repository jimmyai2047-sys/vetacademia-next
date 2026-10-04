import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import bcrypt from "bcryptjs";
import { requireAdminApi } from "@/lib/admin-api";
import { getAdminSession } from "@/lib/admin";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const experts = await prisma.expert.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        qualifications: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = await Promise.all(
      experts.map(async (e) => {
        let signed: string | null = null;
        if (e.photoUrl) {
          signed = await getSignedUrl(e.photoUrl);
        }
        return {
          id: e.id,
          name: e.user.name,
          email: e.user.email,
          specialization: e.specialization,
          fieldCategory: e.fieldCategory,
          designation: e.designation,
          gender: e.gender,
          dob: e.dob,
          awards: e.awards,
          presentPosting: e.presentPosting,
          contactPhone: e.contactPhone,
          showContact: e.showContact,
          experienceYears: e.experienceYears,
          qualifications: e.qualifications,
          bio: e.bio,
          photoUrl: signed,
          photoUrlBase: e.photoUrl,
          hourlyRate: e.hourlyRate,
          isAvailable: e.isAvailable,
          rating: e.rating,
          totalReviews: e.totalReviews,
        };
      })
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Experts GET error:", error);
    return NextResponse.json({ error: "Failed to load experts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req, { strict: true });
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
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

    if (name.length > 100 || specialization.length > 200) {
      return NextResponse.json(
        { error: "Input too long" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const generated = !body.password;
    const password = body.password
      ? String(body.password)
      : Array.from(crypto.getRandomValues(new Uint8Array(9)))
          .map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"[b % 56])
          .join("") + "!";
    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "PROFESSOR",
      },
    });

    const qualifications = Array.isArray(body.qualifications)
      ? body.qualifications
          .filter(
            (q: unknown) =>
              q && typeof (q as { degree?: unknown }).degree === "string"
          )
          .slice(0, 10)
          .map((q: { degree: string; year?: string; institution?: string }, i: number) => ({
            degree: String(q.degree).slice(0, 150),
            year: q.year ? String(q.year).slice(0, 10) : null,
            institution: q.institution ? String(q.institution).slice(0, 200) : null,
            order: i,
          }))
      : [];

    const expert = await prisma.expert.create({
      data: {
        userId: user.id,
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
        qualifications: qualifications.length
          ? { create: qualifications }
          : undefined,
      },
    });

    return NextResponse.json(
      {
        id: expert.id,
        userId: user.id,
        temporaryPassword: generated ? password : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Experts POST error:", error);
    return NextResponse.json({ error: "Failed to create expert" }, { status: 500 });
  }
}
