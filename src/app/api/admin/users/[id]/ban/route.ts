import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi(req, { strict: true });
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (id === auth.session!.user.id) {
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

  logAudit({
    action: updated.banned ? "user.ban" : "user.unban",
    actor: auth.session!.user.id,
    target: id,
  });

  return NextResponse.json({ id: updated.id, banned: updated.banned });
}
