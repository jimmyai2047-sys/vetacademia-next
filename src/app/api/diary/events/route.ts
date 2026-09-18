import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = ["VACCINATION", "DEWORMING", "AI_BREEDING", "CALVING", "ILLNESS", "OTHER"];

async function userId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

async function ownAnimal(uid: string, animalId: string) {
  return prisma.myAnimal.findFirst({ where: { id: animalId, userId: uid } });
}

// GET /api/diary/events?animalId=
export async function GET(req: NextRequest) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const animalId = req.nextUrl.searchParams.get("animalId") ?? "";
  if (!(await ownAnimal(uid, animalId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const events = await prisma.animalEvent.findMany({
    where: { animalId },
    orderBy: { eventDate: "desc" },
    take: 50,
  });
  return NextResponse.json({ events });
}

// POST /api/diary/events — { animalId, type, title, eventDate, nextDue?, notes? }
export async function POST(req: NextRequest) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Login required" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const animalId = typeof body.animalId === "string" ? body.animalId : "";
  if (!(await ownAnimal(uid, animalId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const type = typeof body.type === "string" ? body.type : "";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  const eventDate =
    typeof body.eventDate === "string" && body.eventDate ? new Date(body.eventDate) : null;
  if (!TYPES.includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  if (!eventDate || isNaN(eventDate.getTime())) {
    return NextResponse.json({ error: "Valid date required" }, { status: 400 });
  }
  const nextDue =
    typeof body.nextDue === "string" && body.nextDue ? new Date(body.nextDue) : null;

  const event = await prisma.animalEvent.create({
    data: {
      animalId,
      type,
      title,
      eventDate,
      nextDue: nextDue && !isNaN(nextDue.getTime()) ? nextDue : null,
      notes:
        typeof body.notes === "string" && body.notes.trim()
          ? body.notes.trim().slice(0, 500)
          : null,
    },
  });
  return NextResponse.json({ event }, { status: 201 });
}

// DELETE /api/diary/events?id=
export async function DELETE(req: NextRequest) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const ev = await prisma.animalEvent.findUnique({
    where: { id },
    include: { animal: { select: { userId: true } } },
  });
  if (!ev || ev.animal.userId !== uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.animalEvent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
