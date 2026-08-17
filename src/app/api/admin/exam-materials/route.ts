import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const materials = await prisma.examMaterial.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Exam materials list error:", error);
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
    const {
      category,
      type,
      title,
      description,
      body: chapterBody,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      externalUrl,
      published,
      order,
      subject,
      topic,
      isDemo,
    } = body as {
      category?: string;
      type?: string;
      title?: string;
      description?: string | null;
      body?: string | null;
      fileUrl?: string | null;
      fileName?: string | null;
      fileType?: string | null;
      fileSize?: number | null;
      externalUrl?: string | null;
      published?: boolean;
      order?: number;
      subject?: string | null;
      topic?: string | null;
      isDemo?: boolean;
    };

    if (!category || !type || !title) {
      return NextResponse.json(
        { error: "Category, type and title are required" },
        { status: 400 }
      );
    }

    const material = await prisma.examMaterial.create({
      data: {
        category,
        type,
        title: title.trim(),
        description: description || null,
        body: chapterBody ? sanitizeChapterContent(chapterBody) : null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize ?? null,
        externalUrl: externalUrl || null,
        published: published ?? true,
        order: order ?? 0,
        subject: subject || null,
        topic: topic || null,
        isDemo: isDemo ?? false,
      },
    });
    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error("Exam material create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
