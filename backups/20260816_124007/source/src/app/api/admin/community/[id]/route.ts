import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const existing = await prisma.communityLink.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (typeof body?.platform === "string") data.platform = body.platform;
    if (typeof body?.category === "string") data.category = body.category;
    if (typeof body?.ref === "string") data.ref = body.ref.trim();
    if (typeof body?.title === "string") data.title = body.title.trim();
    if (typeof body?.url === "string") data.url = body.url.trim();
    if (typeof body?.active === "boolean") data.active = body.active;

    const updated = await prisma.communityLink.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Community update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await prisma.communityLink.delete({ where: { id } }).catch(() => null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Community delete error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
