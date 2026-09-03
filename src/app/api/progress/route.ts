import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCsrf } from "@/lib/csrf";

// Per-user study progress (practice scores, flashcard recall %). Persisted so
// progress survives refreshes. Not CSRF-gated (matches other mutation routes
// like /api/consultations).
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ progress: [] });
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");
  const where = subjectId
    ? { userId: session.user.id, subjectId }
    : { userId: session.user.id };
  const rows = await prisma.userProgress.findMany({ where });
  return NextResponse.json({ progress: rows });
}

export async function POST(req: NextRequest) {
  if (!validateCsrf(req)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const subjectId = String(body.subjectId || "");
  const progress = Number(body.progress ?? 0);
  if (!subjectId) {
    return NextResponse.json({ error: "subjectId required" }, { status: 400 });
  }
  // "flashcards" is a synthetic subjectId for the flashcards deck — it has no
  // Subject row, so the FK would fail. Auto-create a placeholder Subject once.
  if (subjectId === "flashcards") {
    const existing = await prisma.subject.findUnique({ where: { id: "flashcards" } });
    if (!existing) {
      const prog = await prisma.programme.findFirst({ select: { id: true } });
      if (prog) {
        await prisma.subject.create({
          data: {
            id: "flashcards",
            name: "Flashcards",
            code: "FLASH-001",
            programmeId: prog.id,
          },
        });
      }
    }
  }

  await prisma.userProgress.upsert({
    where: { userId_subjectId: { userId: session.user.id, subjectId } },
    create: {
      userId: session.user.id,
      subjectId,
      progress,
      lastAccessed: new Date(),
    },
    update: { progress, lastAccessed: new Date() },
  });
  return NextResponse.json({ ok: true });
}
