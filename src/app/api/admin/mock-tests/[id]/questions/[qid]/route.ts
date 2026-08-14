import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { qid } = await params;
    const body = await req.json();
    const { text, options, correctAnswer, marks, explanation } = body as {
      text?: string;
      options?: string[];
      correctAnswer?: number;
      marks?: number;
      explanation?: string;
    };

    const question = await prisma.question.update({
      where: { id: qid },
      data: {
        text: text?.trim(),
        options: options ? JSON.stringify(options) : undefined,
        correctAnswer,
        marks,
        explanation,
      },
    });
    return NextResponse.json(question);
  } catch (error) {
    console.error("Question update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
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
