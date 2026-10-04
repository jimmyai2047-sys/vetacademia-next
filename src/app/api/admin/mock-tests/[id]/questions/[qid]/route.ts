import { validateCsrf } from "@/lib/csrf";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { adminRateLimit, clientIp } from "@/lib/rate-limit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    if (!validateCsrf(req)) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    const { allowed } = await adminRateLimit(clientIp(req), new URL(req.url).pathname);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { qid } = await params;
    const body = await req.json();
    const { text, options, correctAnswer, marks, explanation, difficulty } =
      body as {
        text?: string;
        options?: string[];
        correctAnswer?: number;
        marks?: number;
        explanation?: string;
        difficulty?: number;
      };

    const question = await prisma.question.update({
      where: { id: qid },
      data: {
        text: text?.trim(),
        options: options ? JSON.stringify(options) : undefined,
        correctAnswer,
        marks,
        explanation,
        difficulty:
          typeof difficulty === "number" && difficulty >= 1 && difficulty <= 3
            ? difficulty
            : undefined,
      },
    });
    return NextResponse.json(question);
  } catch (error) {
    console.error("Question update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    if (!validateCsrf(req)) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    const { allowed } = await adminRateLimit(clientIp(req), new URL(req.url).pathname);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { qid } = await params;
    await prisma.question.delete({ where: { id: qid } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Question delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
