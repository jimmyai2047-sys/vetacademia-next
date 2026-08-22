import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function parseOptions(raw: unknown): string[] | null {
  if (Array.isArray(raw)) {
    const arr = raw.filter((o) => typeof o === "string") as string[];
    return arr.length >= 2 ? arr : null;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parseOptions(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await ctx.params;
    const body = await req.json();

    const existing = await prisma.chapterMcq.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "MCQ not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (typeof body.question === "string" && body.question.trim()) {
      data.question = body.question.trim();
    }
    if (body.options !== undefined) {
      const options = parseOptions(body.options);
      if (!options) {
        return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });
      }
      data.options = JSON.stringify(options);
    }
    if (typeof body.correctIndex === "number") {
      const opts = parseOptions(body.options) ??
        (await prisma.chapterMcq.findUnique({ where: { id }, select: { options: true } }))?.options;
      const parsed = parseOptions(opts);
      if (!parsed || body.correctIndex < 0 || body.correctIndex >= parsed.length) {
        return NextResponse.json({ error: "Invalid correct answer" }, { status: 400 });
      }
      data.correctIndex = body.correctIndex;
    }
    if (typeof body.marks === "number") data.marks = body.marks;
    if (typeof body.explanation === "string") {
      data.explanation = body.explanation.trim() || null;
    }
    if (typeof body.difficulty === "number") data.difficulty = body.difficulty;
    if (typeof body.order === "number") data.order = body.order;

    const updated = await prisma.chapterMcq.update({
      where: { id },
      data,
    });
    return NextResponse.json({ ...updated, options: parseOptions(updated.options) ?? [] });
  } catch (error) {
    console.error("Chapter MCQ update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await ctx.params;
    const existing = await prisma.chapterMcq.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "MCQ not found" }, { status: 404 });
    }
    await prisma.chapterMcq.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Chapter MCQ delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
