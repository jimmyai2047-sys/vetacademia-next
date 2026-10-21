import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { processInlineImages } from "@/lib/chapter-images";
import { logAudit } from "@/lib/audit";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const posts = await prisma.blogPost.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Blog list error:", error);
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
    const content = typeof body.content === "string" ? body.content : "";
    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    let slug = typeof body.slug === "string" && slugify(body.slug) ? slugify(body.slug) : slugify(title);
    const clash = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;

    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const reviewedBy = str(body.reviewedBy);
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: str(body.excerpt),
        content: sanitizeChapterContent(await processInlineImages(content)),
        coverImageUrl: str(body.coverImageUrl),
        author: str(body.author) || "VetAcademia Team",
        tags: str(body.tags),
        isPublished: body.isPublished !== false,
        publishedAt: new Date(),
        owner: str(body.owner),
        reviewedBy,
        reviewedAt: reviewedBy ? new Date() : null,
        sourceUrl: str(body.sourceUrl),
      },
    });
    logAudit({
      action: "blog.create",
      actor: session.user.id,
      target: post.id,
      meta: { title, slug, published: post.isPublished },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Blog create error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
