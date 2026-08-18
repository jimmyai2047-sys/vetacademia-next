import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const posts = await prisma.post.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Posts list error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { title, category, content, exam, track, published, file } = body as {
      title?: string;
      category?: string;
      content?: string;
      exam?: string | null;
      track?: string | null;
      published?: boolean;
      file?: {
        url: string;
        fileName: string;
        fileType: string;
        fileSize: number | null;
      } | null;
    };

    if (!title || !category) {
      return NextResponse.json(
        { error: "Title and category required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        category,
        content: content ? sanitizeChapterContent(content) : null,
        exam: exam || null,
        track: track || null,
        published: published ?? true,
        fileUrl: file?.url || null,
        fileName: file?.fileName || null,
        fileType: file?.fileType || null,
        fileSize: file?.fileSize ?? null,
      },
    });
    logAudit({
      action: "post.create",
      actor: session.user.email,
      target: post.id,
      meta: { category },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Post create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
