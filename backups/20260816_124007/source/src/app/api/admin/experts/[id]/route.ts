import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import bcrypt from "bcryptjs";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const expert = await prisma.expert.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });
    if (!expert) {
      return NextResponse.json({ error: "Expert not found" }, { status: 404 });
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
        bio: body.bio || null,
        photoUrl: body.photoUrl || null,
        hourlyRate,
        isAvailable: body.isAvailable !== false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Experts PUT error:", error);
    return NextResponse.json({ error: "Failed to update expert" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
