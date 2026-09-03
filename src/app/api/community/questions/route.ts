import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCsrf } from "@/lib/csrf";

// GET: list recent community questions (public).
// POST: create a question (login required).
export async function GET() {
  const doubts = await prisma.doubt.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json({ doubts });
}

export async function POST(req: NextRequest) {
  if (!validateCsrf(req)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const question = String(body.question || "").trim();
  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }
  const doubt = await prisma.doubt.create({
    data: {
      userId: session.user.id,
      question,
      subject: body.subject ? String(body.subject) : null,
    },
  });
  return NextResponse.json({ doubt });
}
