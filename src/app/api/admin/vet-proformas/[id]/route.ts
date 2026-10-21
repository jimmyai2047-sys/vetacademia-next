import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { isProformaStatus } from "@/lib/proforma-status";

type Body = {
  title?: string; type?: string; description?: string;
  word?: { url: string; fileName: string; fileSize: number | null } | null;
  pdf?: { url: string; fileName: string; fileSize: number | null } | null;
  published?: boolean; order?: number;
  status?: string; version?: string | null; sourceAuthority?: string | null;
  owner?: string | null; reviewedBy?: string | null;
  supersededById?: string | null; supersededAt?: string | null;
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const { id } = await params;
    const existing = await prisma.vetProforma.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await req.json()) as Body;

    if (body.status !== undefined && !isProformaStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    let supersededById: string | null | undefined = undefined;
    if (body.supersededById !== undefined) {
      if (body.supersededById === null) {
        supersededById = null;
      } else {
        if (body.supersededById === id) {
          return NextResponse.json({ error: "A proforma cannot supersede itself" }, { status: 400 });
        }
        const target = await prisma.vetProforma.findUnique({
          where: { id: body.supersededById },
          select: { id: true },
        });
        if (!target) {
          return NextResponse.json({ error: "Replacement proforma not found" }, { status: 404 });
        }
        supersededById = target.id;
      }
    }

    // Approving (or re-approving) stamps the reviewer automatically.
    const approving = body.status === "APPROVED" && existing.status !== "APPROVED";
    const reviewedBy =
      body.reviewedBy !== undefined
        ? body.reviewedBy?.trim() || null
        : approving
          ? session.user.email ?? null
          : undefined;
    const reviewedAt =
      body.reviewedBy !== undefined || approving ? new Date() : undefined;

    const data: Record<string, unknown> = {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.word !== undefined && {
        wordUrl: body.word?.url || null,
        wordName: body.word?.fileName || null,
        wordSize: body.word?.fileSize ?? null,
      }),
      ...(body.pdf !== undefined && {
        pdfUrl: body.pdf?.url || null,
        pdfName: body.pdf?.fileName || null,
        pdfSize: body.pdf?.fileSize ?? null,
      }),
      ...(body.published !== undefined && { published: body.published }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.version !== undefined && { version: body.version?.trim() || null }),
      ...(body.sourceAuthority !== undefined && {
        sourceAuthority: body.sourceAuthority?.trim() || null,
      }),
      ...(body.owner !== undefined && { owner: body.owner?.trim() || null }),
      ...(reviewedBy !== undefined && { reviewedBy }),
      ...(reviewedAt !== undefined && { reviewedAt }),
      ...(supersededById !== undefined && { supersededById }),
      ...(body.supersededAt !== undefined && {
        supersededAt: body.supersededAt ? new Date(body.supersededAt) : null,
      }),
    };

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.vetProforma.update({ where: { id }, data });
    logAudit({
      action: "vet-proforma.update",
      actor: session.user.email,
      target: id,
      meta: {
        fields: Object.keys(data),
        before: { status: existing.status, published: existing.published },
        after: { status: updated.status, published: updated.published },
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const { id } = await params;
    const existing = await prisma.vetProforma.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Approved documents are the live public set — require an explicit
    // archive (or unsuperseded draft state) before hard deletion.
    if (existing.status === "APPROVED") {
      return NextResponse.json(
        { error: "Approved proformas must be archived before deletion." },
        { status: 409 }
      );
    }

    await prisma.vetProforma.delete({ where: { id } });
    logAudit({
      action: "vet-proforma.delete",
      actor: session.user.email,
      target: id,
      meta: { title: existing.title, status: existing.status },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
