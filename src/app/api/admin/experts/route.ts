import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { getDownloadUrl } from "@vercel/blob";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const experts = await prisma.expert.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    const data = await Promise.all(
      experts.map(async (e) => {
        let signed: string | null = null;
        if (e.photoUrl) {
          try {
            signed = await getDownloadUrl(e.photoUrl);
          } catch {
            signed = null;
          }
        }
        return {
          id: e.id,
          name: e.user.name,
          email: e.user.email,
          specialization: e.specialization,
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
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const password = body.password ? String(body.password) : "expert123";
    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "EXPERT",
      },
    });

    const expert = await prisma.expert.create({
      data: {
        userId: user.id,
        specialization,
        bio: body.bio || null,
        photoUrl: body.photoUrl || null,
        hourlyRate,
        isAvailable: body.isAvailable !== false,
      },
    });

    return NextResponse.json(
      { id: expert.id, userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Experts POST error:", error);
    return NextResponse.json({ error: "Failed to create expert" }, { status: 500 });
  }
}
