import { NextResponse, NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const data = await prisma.vetProforma.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json(data);
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
    const { title, type, description, word, pdf, published, order } = body as {
      title?: string; type?: string; description?: string;
      word?: { url: string; fileName: string; fileSize: number | null } | null;
      pdf?: { url: string; fileName: string; fileSize: number | null } | null;
      published?: boolean; order?: number;
    };
    if (!title || !type) return NextResponse.json({ error: "Title and type required" }, { status: 400 });
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
      },
    });
    logAudit({ action: "vet-proforma.create", actor: session.user.email, target: created.id, meta: { type } });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
