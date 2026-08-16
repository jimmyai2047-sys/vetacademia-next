import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { parseQuestions } from "@/lib/parse-questions";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const test = await prisma.mockTest.findUnique({ where: { id } });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = parseQuestions(body.text || "");
    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "No questions found in the pasted text" },
        { status: 400 }
      );
    }
    const invalid = parsed.filter((q) => q.error);
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          error: `${invalid.length} of ${parsed.length} questions could not be parsed`,
          details: invalid.map((q, i) => ({
            line: i + 1,
            reason: q.error,
            text: q.text.slice(0, 80),
          })),
        },
        { status: 400 }
      );
    }

    const marks = Number(body.marks) || 1;
    await prisma.question.createMany({
      data: parsed.map((q) => ({
        text: q.text,
        options: JSON.stringify(q.options),
        correctAnswer: q.correctAnswer,
        marks,
        explanation: q.explanation,
        mockTestId: id,
      })),
    });

    return NextResponse.json({ created: parsed.length });
  } catch (error) {
    console.error("Bulk question import error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
