import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/blob";
import { env } from "@/lib/env";
import { logAudit } from "@/lib/audit";
import { reportInputSchema } from "@/lib/report-input";
import { buildReportBytes } from "@/lib/report-builder";

export const dynamic = "force-dynamic";

function parseMeta(meta: string | null): Record<string, unknown> {
  if (!meta) return {};
  try {
    const obj = JSON.parse(meta);
    if (obj && typeof obj === "object") return obj as Record<string, unknown>;
  } catch {
    return { raw: meta };
  }
  return {};
}

// Support view for one project-report order: file + the payment that bought
// it (finding 7: "cannot correlate report → payment from admin alone").
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi(req, { method: "GET" });
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const report = await prisma.generatedReport.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Primary link is GeneratedReport.paymentId; fall back to the payment's
  // metadata { generatedReportId } for rows finalized before that column existed.
  let payment = report.paymentId
    ? await prisma.payment.findUnique({
        where: { id: report.paymentId },
        select: {
          id: true,
          amount: true,
          status: true,
          method: true,
          orderId: true,
          paymentId: true,
          createdAt: true,
        },
      })
    : null;

  if (!payment) {
    const candidates = await prisma.payment.findMany({
      where: { userId: report.userId, planSlug: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amount: true,
        status: true,
        method: true,
        orderId: true,
        paymentId: true,
        createdAt: true,
        metadata: true,
      },
    });
    const hit = candidates.find((c) => {
      const m = parseMeta(c.metadata);
      return (
        m.generatedReportId === report.id ||
        (typeof m.raw === "string" && m.raw === report.id)
      );
    });
    if (hit) {
      payment = {
        id: hit.id,
        amount: hit.amount,
        status: hit.status,
        method: hit.method,
        orderId: hit.orderId,
        paymentId: hit.paymentId,
        createdAt: hit.createdAt,
      };
    }
  }

  return NextResponse.json({
    report: {
      id: report.id,
      title: report.title,
      animalType: report.animalType,
      language: report.language,
      status: report.status,
      amount: report.amount,
      blobUrl: report.blobUrl,
      paymentId: report.paymentId,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      user: report.user,
    },
    payment,
    downloadUrl: report.blobUrl ? await getSignedUrl(report.blobUrl) : "",
  });
}

// Admin regeneration — rebuilds the SAME final PDF from the stored inputs and
// overwrites the Blob object. Never charges, never touches Payment or the
// report's PAID status; it is a repair action for support tickets.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi(req, { method: "POST" });
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const report = await prisma.generatedReport.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  if (report.status !== "PAID" || !report.paymentId) {
    return NextResponse.json(
      { error: "Only a paid, fulfilled report can be regenerated" },
      { status: 409 }
    );
  }

  let parsed;
  try {
    parsed = reportInputSchema.safeParse(JSON.parse(report.inputJson));
  } catch {
    parsed = { success: false as const };
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Stored input is invalid — cannot regenerate" },
      { status: 400 }
    );
  }

  const bytes = await buildReportBytes(parsed.data, {
    mode: "final",
    reportTitle: report.title,
  });
  if (!bytes) {
    return NextResponse.json(
      { error: "Unsupported animalType in stored input" },
      { status: 400 }
    );
  }

  // Same key as finalize → overwrites in place, so the customer's existing
  // dashboard link keeps working after the repair.
  const blob = await put(`reports/${report.userId}/${report.id}.pdf`, Buffer.from(bytes), {
    access: "private",
    contentType: "application/pdf",
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    multipart: true,
  });

  await prisma.generatedReport.update({
    where: { id: report.id },
    data: { blobUrl: blob.url },
  });

  logAudit({
    action: "report.regenerate",
    actor: guard.session!.user.id,
    target: report.id,
    meta: {
      animalType: report.animalType,
      paymentId: report.paymentId,
      changed: "blobUrl (no charge, status unchanged)",
    },
  });

  return NextResponse.json({ downloadUrl: await getSignedUrl(blob.url) });
}
