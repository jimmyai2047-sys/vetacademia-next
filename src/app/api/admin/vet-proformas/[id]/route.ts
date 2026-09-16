import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const { title, type, description, word, pdf, published, order } = body as any;
    const updated = await prisma.vetProforma.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(word !== undefined && { wordUrl: word?.url || null, wordName: word?.fileName || null, wordSize: word?.fileSize ?? null }),
        ...(pdf !== undefined && { pdfUrl: pdf?.url || null, pdfName: pdf?.fileName || null, pdfSize: pdf?.fileSize ?? null }),
        ...(published !== undefined && { published }),
        ...(order !== undefined && { order }),
      },
    });
    logAudit({ action: "vet-proforma.update", actor: session.user.email, target: id });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.vetProforma.delete({ where: { id } });
    logAudit({ action: "vet-proforma.delete", actor: session.user.email, target: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
