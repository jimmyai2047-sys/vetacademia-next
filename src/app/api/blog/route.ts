import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        author: true,
        tags: true,
        coverImageUrl: true,
        publishedAt: true,
      },
    });
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Blog API error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
