import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tests = await prisma.mockTest.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } },
    });
    return NextResponse.json(tests);
  } catch (error) {
    console.error("Mock tests list error:", error);
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
      description,
      duration,
      totalMarks,
      subjectId,
      exam,
      track,
      isAdaptive,
      kind,
      year,
      file,
    } = body as {
      title?: string;
      description?: string;
      duration?: number;
      totalMarks?: number;
      subjectId?: string | null;
      exam?: string | null;
      track?: string | null;
      isAdaptive?: boolean;
      kind?: string;
      year?: string | null;
      file?: {
        url: string;
        fileName: string;
        fileType: string;
      } | null;
    };

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const resolvedKind = (kind || (isAdaptive ? "ADAPTIVE" : "MOCK")).toUpperCase();
    const kindValue =
      resolvedKind === "PREVIOUS_YEAR" ||
      resolvedKind === "ADAPTIVE" ||
      resolvedKind === "MOCK"
        ? resolvedKind
        : "MOCK";

    const test = await prisma.mockTest.create({
      data: {
        title: title.trim(),
        description: description || null,
        duration: duration ?? 30,
        totalMarks: totalMarks ?? 0,
        subjectId: subjectId || null,
        exam: exam || null,
        track: track || null,
        isAdaptive: kindValue === "ADAPTIVE",
        kind: kindValue,
        year: kindValue === "PREVIOUS_YEAR" ? year || null : null,
        fileUrl: file?.url || null,
        fileName: file?.fileName || null,
        fileType: file?.fileType || null,
      },
    });
    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("Mock test create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
