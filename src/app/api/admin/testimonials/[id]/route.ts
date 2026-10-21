import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

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
    const existing = await prisma.testimonial.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};
    const changed: string[] = [];
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    if (typeof body.name === "string" && body.name.trim()) { data.name = body.name.trim(); changed.push("name"); }
    if (typeof body.exam === "string" && body.exam.trim()) { data.exam = body.exam.trim(); changed.push("exam"); }
    if (typeof body.quote === "string" && body.quote.trim()) { data.quote = body.quote.trim(); changed.push("quote"); }
    for (const key of ["programme", "owner", "reviewedBy", "sourceUrl"] as const) {
      if (key in body) {
        data[key] = str(body[key]);
        changed.push(key);
      }
    }
    if (typeof body.rating === "number" && body.rating >= 0 && body.rating <= 5) {
      data.rating = body.rating;
      changed.push("rating");
    }
    if (typeof body.intakeYear === "number") {
      data.intakeYear = body.intakeYear > 1900 ? Math.floor(body.intakeYear) : null;
      changed.push("intakeYear");
    }
    if (typeof body.isApproved === "boolean") {
      data.isApproved = body.isApproved;
      changed.push("isApproved");
    }
    if (typeof body.reviewedBy === "string" && body.reviewedBy.trim()) data.reviewedAt = new Date();

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    const item = await prisma.testimonial.update({ where: { id }, data });
    logAudit({ action: "testimonial.update", actor: session.user.id, target: id, meta: { fields: changed } });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Testimonial update error:", error);
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
    const item = await prisma.testimonial.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.testimonial.delete({ where: { id } });
    logAudit({ action: "testimonial.delete", actor: session.user.id, target: id, meta: { name: item.name } });
    return NextResponse.json({ deleted: id });
  } catch (error) {
    console.error("Testimonial delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
