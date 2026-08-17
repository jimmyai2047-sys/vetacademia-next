import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot ban your own account" },
      { status: 403 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { banned: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { banned: !target.banned },
  });

  return NextResponse.json({ id: updated.id, banned: updated.banned });
}
