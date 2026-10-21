import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { BOOK_LEVELS } from "@/lib/reference-dictionary";

const LEVELS: readonly string[] = BOOK_LEVELS;

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const books = await prisma.book.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json(books);
  } catch (error) {
    console.error("Books list error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    if (!title || !subject) {
      return NextResponse.json({ error: "Title and subject are required" }, { status: 400 });
    }
    const level = typeof body.level === "string" && LEVELS.includes(body.level) ? body.level : "General";
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const reviewedBy = str(body.reviewedBy);
    const book = await prisma.book.create({
      data: {
        title,
        subject,
        level,
        author: str(body.author),
        publisher: str(body.publisher),
        edition: str(body.edition),
        description: str(body.description),
        coverImageUrl: str(body.coverImageUrl),
        isRecommended: body.isRecommended !== false,
        order: typeof body.order === "number" && body.order >= 0 ? Math.floor(body.order) : 0,
        owner: str(body.owner),
        reviewedBy,
        reviewedAt: reviewedBy ? new Date() : null,
        sourceUrl: str(body.sourceUrl),
      },
    });
    logAudit({ action: "book.create", actor: session.user.id, target: book.id, meta: { title, subject } });
    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Book create error:", error);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}
