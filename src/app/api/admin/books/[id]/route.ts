import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { BOOK_LEVELS } from "@/lib/reference-dictionary";

const LEVELS: readonly string[] = BOOK_LEVELS;

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const { id } = await ctx.params;
    const existing = await prisma.book.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};
    const changed: string[] = [];
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    if (typeof body.title === "string" && body.title.trim()) { data.title = body.title.trim(); changed.push("title"); }
    if (typeof body.subject === "string" && body.subject.trim()) { data.subject = body.subject.trim(); changed.push("subject"); }
    if (typeof body.level === "string" && LEVELS.includes(body.level)) { data.level = body.level; changed.push("level"); }
    for (const key of ["author", "publisher", "edition", "description", "coverImageUrl", "owner", "reviewedBy", "sourceUrl"] as const) {
      if (key in body) {
        data[key] = str(body[key]);
        changed.push(key);
      }
    }
    if (typeof body.isRecommended === "boolean") { data.isRecommended = body.isRecommended; changed.push("isRecommended"); }
    if (typeof body.order === "number" && body.order >= 0) { data.order = Math.floor(body.order); changed.push("order"); }
    if (typeof body.reviewedBy === "string" && body.reviewedBy.trim()) data.reviewedAt = new Date();

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    const book = await prisma.book.update({ where: { id }, data });
    logAudit({ action: "book.update", actor: session.user.id, target: id, meta: { fields: changed } });
    return NextResponse.json(book);
  } catch (error) {
    console.error("Book update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const { id } = await ctx.params;
    const book = await prisma.book.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.book.delete({ where: { id } });
    logAudit({ action: "book.delete", actor: session.user.id, target: id, meta: { title: book.title } });
    return NextResponse.json({ deleted: id });
  } catch (error) {
    console.error("Book delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
