import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCsrf } from "@/lib/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ownAnimal(userId: string, id: string) {
  return prisma.myAnimal.findFirst({ where: { id, userId } });
}

// PATCH /api/diary/animals/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateCsrf(req)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });
    const { id } = await params;
    if (!(await ownAnimal(userId, id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const str = (v: unknown, n = 80) =>
      typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null;
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim().slice(0, 80);
    if (typeof body.tagNo !== "undefined") data.tagNo = str(body.tagNo, 40);
    if (typeof body.breed !== "undefined") data.breed = str(body.breed);
    if (body.gender === "Female" || body.gender === "Male" || body.gender === null)
      data.gender = body.gender;
    if (typeof body.notes !== "undefined") data.notes = str(body.notes, 500);
    if (typeof body.dob !== "undefined") {
      const d = typeof body.dob === "string" && body.dob ? new Date(body.dob) : null;
      data.dob = d && !isNaN(d.getTime()) ? d : null;
    }

    const animal = await prisma.myAnimal.update({ where: { id }, data });
    return NextResponse.json({ animal });
  } catch (error) {
    console.error("Diary animal PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/diary/animals/[id] (cascades milk + events)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateCsrf(req)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });
    const { id } = await params;
    if (!(await ownAnimal(userId, id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.myAnimal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Diary animal DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
