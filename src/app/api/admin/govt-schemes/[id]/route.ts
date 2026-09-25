import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { sanitizeChapterContent } from "@/lib/content";
import { processInlineImages } from "@/lib/chapter-images";
import { logAudit } from "@/lib/audit";

const CATEGORIES = ["BIMA", "SUBSIDY", "LOAN", "VACCINATION", "OTHER"];
const LEVELS = ["CENTRAL", "RAJASTHAN", "ALL_STATES"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const { title, category, level, summary, details, linkUrl, linkLabel, lastDate, published, order } = body as Record<string, unknown>;

    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const data: Record<string, unknown> = {};
    if (typeof title === "string" && title.trim()) data.title = title.trim();
    if (typeof category === "string" && CATEGORIES.includes(category)) data.category = category;
    if (typeof level === "string" && LEVELS.includes(level)) data.level = level;
    if (typeof summary !== "undefined") data.summary = str(summary);
    if (typeof details !== "undefined")
      data.details =
        typeof details === "string" && details.trim()
          ? sanitizeChapterContent(await processInlineImages(details))
          : null;
    if (typeof linkUrl !== "undefined") data.linkUrl = str(linkUrl);
    if (typeof linkLabel !== "undefined") data.linkLabel = str(linkLabel);
    if (typeof lastDate !== "undefined") data.lastDate = str(lastDate);
    if (typeof published === "boolean") data.published = published;
    if (typeof order === "number") data.order = order;

    const scheme = await prisma.govtScheme.update({ where: { id }, data });
    logAudit({ action: "govtScheme.update", actor: session.user.email, target: id });
    return NextResponse.json(scheme);
  } catch (error) {
    console.error("Govt scheme update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const { id } = await params;
    await prisma.govtScheme.delete({ where: { id } });
    logAudit({ action: "govtScheme.delete", actor: session.user.email, target: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Govt scheme delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
