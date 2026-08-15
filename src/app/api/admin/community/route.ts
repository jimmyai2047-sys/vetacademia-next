import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const links = await prisma.communityLink.findMany({
      orderBy: [{ category: "asc" }, { ref: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(links);
  } catch (error) {
    console.error("Community list error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const { platform, category, ref, title, url, active } = body ?? {};

    if (
      !["WHATSAPP", "TELEGRAM"].includes(platform) ||
      !["PROGRAMME", "EXAM", "ROLE"].includes(category) ||
      typeof ref !== "string" ||
      !ref.trim() ||
      typeof title !== "string" ||
      !title.trim() ||
      typeof url !== "string" ||
      !url.trim()
    ) {
      return NextResponse.json(
        { error: "platform, category, ref, title and url are required" },
        { status: 400 }
      );
    }

    const created = await prisma.communityLink.create({
      data: {
        platform,
        category,
        ref: ref.trim(),
        title: title.trim(),
        url: url.trim(),
        active: typeof active === "boolean" ? active : true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Community create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
