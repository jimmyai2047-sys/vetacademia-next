import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPECIES = ["Cattle", "Buffalo", "Goat", "Sheep", "Poultry", "Pig", "Other"];

async function requireUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

// GET /api/diary/animals — user's animals + upcoming dues
export async function GET() {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const animals = await prisma.myAnimal.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { milkLogs: true, events: true } },
      events: {
        where: { nextDue: { gte: today } },
        orderBy: { nextDue: "asc" },
        take: 3,
        select: { id: true, type: true, title: true, nextDue: true },
      },
      milkLogs: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true, morning: true, evening: true },
      },
    },
  });
  return NextResponse.json({ animals });
}

// POST /api/diary/animals — add animal
export async function POST(req: NextRequest) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const species = typeof body.species === "string" ? body.species : "";
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!SPECIES.includes(species)) {
    return NextResponse.json({ error: "Invalid species" }, { status: 400 });
  }

  const str = (v: unknown, n = 80) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null;
  const dob =
    typeof body.dob === "string" && body.dob ? new Date(body.dob) : null;

  const animal = await prisma.myAnimal.create({
    data: {
      userId,
      name,
      species,
      tagNo: str(body.tagNo, 40),
      breed: str(body.breed),
      gender:
        body.gender === "Female" || body.gender === "Male"
          ? (body.gender as string)
          : null,
      dob: dob && !isNaN(dob.getTime()) ? dob : null,
      notes: str(body.notes, 500),
    },
  });
  return NextResponse.json({ animal }, { status: 201 });
}
