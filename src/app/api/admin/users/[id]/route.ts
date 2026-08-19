import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STUDENT, ANIMAL_OWNER, GUEST, ADMIN, EXPERT_ROLES } from "@/lib/roles";
import { requireAdminApi } from "@/lib/admin-api";
import { logAudit } from "@/lib/audit";

const VALID_ROLES = new Set<string>([
  STUDENT,
  ANIMAL_OWNER,
  GUEST,
  ADMIN,
  ...EXPERT_ROLES,
]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi(req, { strict: true });
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const role = body?.role;

  if (typeof role !== "string" || !VALID_ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (id === auth.session!.user.id && role !== ADMIN) {
    return NextResponse.json(
      { error: "You cannot remove your own admin role" },
      { status: 403 }
    );
  }

  try {
    const updated = await prisma.user.update({ where: { id }, data: { role } });
    logAudit({
      action: "user.role_change",
      actor: auth.session!.user.id,
      target: id,
      meta: { newRole: role },
    });
    return NextResponse.json({ id: updated.id, role: updated.role });
  } catch {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi(req, { strict: true });
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (id === auth.session!.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 403 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: ADMIN } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin" },
        { status: 403 }
      );
    }
  }

  try {
    await prisma.user.delete({ where: { id } });
    logAudit({
      action: "user.delete",
      actor: auth.session!.user.id,
      target: id,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
