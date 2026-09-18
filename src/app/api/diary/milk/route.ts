import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function userId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

async function ownAnimal(uid: string, animalId: string) {
  return prisma.myAnimal.findFirst({ where: { id: animalId, userId: uid } });
}

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return isNaN(n) || n < 0 ? 0 : Math.min(n, 200);
};

// GET /api/diary/milk?animalId= — last 30 entries
export async function GET(req: NextRequest) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const animalId = req.nextUrl.searchParams.get("animalId") ?? "";
  if (!(await ownAnimal(uid, animalId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const logs = await prisma.milkLog.findMany({
    where: { animalId },
    orderBy: { date: "desc" },
    take: 30,
  });
  return NextResponse.json({ logs });
}

// POST /api/diary/milk — upsert one day { animalId, date, morning, evening }
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
  const date =
    typeof body.date === "string" && body.date ? new Date(body.date) : null;
  if (!date || isNaN(date.getTime())) {
    return NextResponse.json({ error: "Valid date required" }, { status: 400 });
  }

  const log = await prisma.milkLog.upsert({
    where: { animalId_date: { animalId, date } },
    update: { morning: num(body.morning), evening: num(body.evening) },
    create: { animalId, date, morning: num(body.morning), evening: num(body.evening) },
  });
  await prisma.myAnimal.update({ where: { id: animalId }, data: {} });
  return NextResponse.json({ log }, { status: 201 });
}

// DELETE /api/diary/milk?id=
export async function DELETE(req: NextRequest) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const log = await prisma.milkLog.findUnique({
    where: { id },
    include: { animal: { select: { userId: true } } },
  });
  if (!log || log.animal.userId !== uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.milkLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
