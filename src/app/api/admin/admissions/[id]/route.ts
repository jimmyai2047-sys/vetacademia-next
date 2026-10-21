import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// GET: full enquiry detail + note history + linked/matched user for follow-up.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: "desc" } },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    // Registered user with the same email (not yet linked) → one-click link.
    const matchedUser = enquiry.userId
      ? null
      : await prisma.user.findFirst({
          where: { email: { equals: enquiry.email, mode: "insensitive" } },
          select: { id: true, name: true, email: true, role: true },
        });

    // Purchases for the linked user so support can see conversion → access.
    const payments = enquiry.userId
      ? await prisma.payment.findMany({
          where: { userId: enquiry.userId, status: "PAID" },
          orderBy: { createdAt: "desc" },
          select: { id: true, amount: true, planSlug: true, expiresAt: true, createdAt: true },
        })
      : [];

    return NextResponse.json({ enquiry, matchedUser, payments });
  } catch (error) {
    console.error("Admission enquiry detail error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST: append a follow-up note (history is append-only).
export async function POST(
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

    const enquiry = await prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const noteBody = typeof body?.body === "string" ? body.body.trim() : "";
    if (!noteBody) {
      return NextResponse.json({ error: "Note body is required" }, { status: 400 });
    }
    if (noteBody.length > 2000) {
      return NextResponse.json({ error: "Note is too long (max 2000 chars)" }, { status: 400 });
    }

    const note = await prisma.enquiryNote.create({
      data: {
        enquiryId: id,
        author: session.user.email || session.user.id || "unknown",
        body: noteBody,
      },
    });
    logAudit({
      action: "enquiry.note",
      actor: session.user.id,
      target: id,
      meta: { noteId: note.id, length: noteBody.length },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Admission enquiry note error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
