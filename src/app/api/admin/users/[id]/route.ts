import { validateCsrf } from "@/lib/csrf";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STUDENT, ANIMAL_OWNER, GUEST, ADMIN, EXPERT_ROLES } from "@/lib/roles";
import { requireAdminApi } from "@/lib/admin-api";
import { logAudit } from "@/lib/audit";
import type { Role } from "@prisma/client";

const VALID_ROLES = new Set<string>([
  STUDENT,
  ANIMAL_OWNER,
  GUEST,
  ADMIN,
  ...EXPERT_ROLES,
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateCsrf(req)) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
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
    const updated = await prisma.user.update({ where: { id }, data: { role: role as Role } });
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateCsrf(req)) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
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
    // Soft-delete: ban + anonymize PII, but KEEP the row so the money/audit
    // ledger (payments, attempts, consultations, reports) stays intact.
    // Hard-deleting would cascade-wipe the user's entire history.
    const anonEmail = `deleted_${id}@deleted.local`;
    await prisma.user.update({
      where: { id },
      data: {
        banned: true,
        name: "Deleted User",
        email: anonEmail,
        password: `deleted:${Date.now()}:${id}`,
        phone: null,
        avatar: null,
        institution: null,
        programme: null,
        year: null,
        surname: null,
        college: null,
        university: null,
        address: null,
        highestDegree: null,
        expertDesignation: null,
        subjectDepartment: null,
        specialization: null,
      },
    });
    await prisma.expert.updateMany({
      where: { userId: id },
      data: {
        contactPhone: null,
        dob: null,
        photoUrl: null,
        presentPosting: null,
        bio: null,
        awards: null,
        isAvailable: false,
      },
    });
    logAudit({
      action: "user.delete",
      actor: auth.session!.user.id,
      target: id,
      meta: { mode: "soft" },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
