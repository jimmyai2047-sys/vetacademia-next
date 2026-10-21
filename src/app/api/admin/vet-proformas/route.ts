import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { isProformaStatus } from "@/lib/proforma-status";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const data = await prisma.vetProforma.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    // supersededById is a plain string reference (no FK) — resolve titles so
    // the manager can label "superseded by X" without N+1 queries.
    const ids = data.map((p) => p.id);
    const byId = new Map(data.map((p) => [p.id, p.title]));
    for (const p of data) {
      if (p.supersededById && !byId.has(p.supersededById)) ids.push(p.supersededById);
    }
    const extra = ids.length
      ? await prisma.vetProforma.findMany({
          where: { id: { in: ids } },
          select: { id: true, title: true },
        })
      : [];
    for (const e of extra) byId.set(e.id, e.title);
    return NextResponse.json(
      data.map((p) => ({
        ...p,
        supersededByTitle: p.supersededById ? byId.get(p.supersededById) ?? null : null,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const body = await req.json();
    const { title, type, description, word, pdf, published, order, status, version, sourceAuthority, owner } = body as {
      title?: string; type?: string; description?: string;
      word?: { url: string; fileName: string; fileSize: number | null } | null;
      pdf?: { url: string; fileName: string; fileSize: number | null } | null;
      published?: boolean; order?: number;
      status?: string; version?: string | null; sourceAuthority?: string | null; owner?: string | null;
    };
    if (!title || !type) return NextResponse.json({ error: "Title and type required" }, { status: 400 });
    if (status !== undefined && !isProformaStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    // New uploads enter the lifecycle as DRAFT unless explicitly stated —
    // they only appear publicly after an APPROVE action.
    const finalStatus = status ?? "DRAFT";
    const created = await prisma.vetProforma.create({
      data: {
        title: title.trim(),
        type,
        description: description?.trim() || null,
        wordUrl: word?.url || null,
        wordName: word?.fileName || null,
        wordSize: word?.fileSize ?? null,
        pdfUrl: pdf?.url || null,
        pdfName: pdf?.fileName || null,
        pdfSize: pdf?.fileSize ?? null,
        published: published ?? true,
        order: order ?? 0,
        status: finalStatus,
        version: version?.trim() || null,
        sourceAuthority: sourceAuthority?.trim() || null,
        owner: (owner?.trim() || null) ?? session.user.email ?? null,
        ...(finalStatus === "APPROVED"
          ? { reviewedBy: session.user.email ?? null, reviewedAt: new Date() }
          : {}),
      },
    });
    logAudit({ action: "vet-proforma.create", actor: session.user.email, target: created.id, meta: { type, status: finalStatus } });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
