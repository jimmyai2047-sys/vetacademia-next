import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { processInlineImages } from "@/lib/chapter-images";
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
    const existing = await prisma.blogPost.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};
    const changed: string[] = [];
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    if (typeof body.title === "string" && body.title.trim()) { data.title = body.title.trim(); changed.push("title"); }
    if (typeof body.content === "string" && body.content) {
      data.content = sanitizeChapterContent(await processInlineImages(body.content));
      changed.push("content");
    }
    for (const key of ["excerpt", "coverImageUrl", "author", "tags", "owner", "reviewedBy", "sourceUrl"] as const) {
      if (key in body) {
        data[key] = str(body[key]);
        changed.push(key);
      }
    }
    if (typeof body.isPublished === "boolean") {
      data.isPublished = body.isPublished;
      changed.push("isPublished");
      if (body.isPublished) data.publishedAt = new Date();
    }
    if (typeof body.reviewedBy === "string" && body.reviewedBy.trim()) data.reviewedAt = new Date();

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    const post = await prisma.blogPost.update({ where: { id }, data });
    logAudit({
      action: "blog.update",
      actor: session.user.id,
      target: id,
      meta: { fields: changed, published: post.isPublished },
    });
    return NextResponse.json(post);
  } catch (error) {
    console.error("Blog update error:", error);
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
    const post = await prisma.blogPost.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.blogPost.delete({ where: { id } });
    logAudit({ action: "blog.delete", actor: session.user.id, target: id, meta: { title: post.title } });
    return NextResponse.json({ deleted: id });
  } catch (error) {
    console.error("Blog delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
