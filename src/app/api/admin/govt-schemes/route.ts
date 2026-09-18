import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { processInlineImages } from "@/lib/chapter-images";
import { logAudit } from "@/lib/audit";

const CATEGORIES = ["BIMA", "SUBSIDY", "LOAN", "VACCINATION", "OTHER"];
const LEVELS = ["CENTRAL", "RAJASTHAN", "ALL_STATES"];

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const schemes = await prisma.govtScheme.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(schemes);
  } catch (error) {
    console.error("Govt schemes list error:", error);
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
    const { title, category, level, summary, details, linkUrl, linkLabel, lastDate, published, order } = body as Record<string, unknown>;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (typeof category !== "string" || !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Valid category is required" }, { status: 400 });
    }
    if (typeof level !== "string" || !LEVELS.includes(level)) {
      return NextResponse.json({ error: "Valid level is required" }, { status: 400 });
    }

    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const scheme = await prisma.govtScheme.create({
      data: {
        title: title.trim(),
        category,
        level,
        summary: str(summary),
        details: typeof details === "string" && details.trim()
          ? sanitizeChapterContent(await processInlineImages(details))
          : null,
        linkUrl: str(linkUrl),
        linkLabel: str(linkLabel),
        lastDate: str(lastDate),
        published: typeof published === "boolean" ? published : true,
        order: typeof order === "number" ? order : 0,
      },
    });
    logAudit({
      action: "govtScheme.create",
      actor: session.user.email,
      target: scheme.id,
      meta: { category },
    });
    return NextResponse.json(scheme, { status: 201 });
  } catch (error) {
    console.error("Govt scheme create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
