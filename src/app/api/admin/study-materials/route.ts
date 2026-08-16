import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: "desc" },
      include: { subject: { include: { programme: true } } },
    });
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Study materials list error:", error);
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
      title,
      type,
      content,
      url,
      subjectId,
      isDemo,
      isPublic,
    } = body as {
      title?: string;
      type?: string;
      content?: string | null;
      url?: string | null;
      subjectId?: string | null;
      isDemo?: boolean;
      isPublic?: boolean;
    };

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const material = await prisma.studyMaterial.create({
      data: {
        title: title.trim(),
        type: type || "NOTE",
        content: content || null,
        url: url || null,
        subjectId: subjectId || null,
        userId: null,
        isDemo: isDemo ?? false,
        isPublic: isPublic ?? true,
      },
    });
    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error("Study material create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
