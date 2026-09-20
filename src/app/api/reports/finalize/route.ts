import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { getSignedUrl } from "@/lib/blob";
import { reportInputSchema } from "@/lib/report-input";
import { buildGoatReport } from "@/lib/goat-report-pdf";
import { buildSheepReport } from "@/lib/sheep-report-pdf";
import { buildPigReport } from "@/lib/pig-report-pdf";
import { buildPoultryReport } from "@/lib/poultry-report-pdf";
import { buildDairyReport } from "@/lib/dairy-report-pdf";
import { buildProcessingReport } from "@/lib/processing-report-pdf";

// After a PAID payment: rebuild the final PDF, store on private Blob,
// mark the report PAID, and return a signed download URL.
export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const rl = await rateLimit(`report-finalize:${clientIp(req)}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { reportId, paymentId } = await req.json();
    if (!reportId || !paymentId) {
      return NextResponse.json({ error: "reportId and paymentId required" }, { status: 400 });
    }
    const report = await prisma.generatedReport.findFirst({
      where: { id: reportId, userId: session.user.id },
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    if (report.status === "PAID" && report.blobUrl) {
      return NextResponse.json({ downloadUrl: await getSignedUrl(report.blobUrl) });
    }
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: session.user.id, status: "PAID" },
    });
    if (!payment || payment.amount < report.amount) {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }
    const parsed = reportInputSchema.safeParse(JSON.parse(report.inputJson));
    if (!parsed.success) {
      return NextResponse.json({ error: "Stored input invalid" }, { status: 400 });
    }
    const input = parsed.data as any;
    let bytes: Uint8Array;
    switch (input.animalType) {
      case "GOAT":
        bytes = await buildGoatReport({
          cover: input.cover,
          location: input.location,
          program: input.program,
          plan: input.plan,
          department: input.department,
          schemeShort: input.schemeShort,
          breedName: input.breedName,
          rates: input.rates,
          language: input.language,
          mode: "final",
          reportTitle: report.title,
          verifyByVetCA: input.verifyByVetCA,
        });
        break;
      case "SHEEP":
        bytes = await buildSheepReport({
          cover: input.cover,
          location: input.location,
          program: input.program,
          plan: input.plan,
          department: input.department,
          schemeShort: input.schemeShort,
          breedName: input.breedName,
          rates: input.rates,
          language: input.language,
          mode: "final",
          reportTitle: report.title,
          verifyByVetCA: input.verifyByVetCA,
        });
        break;
      case "PIG":
        bytes = await buildPigReport({
          cover: input.cover,
          location: input.location,
          program: input.program,
          plan: input.plan,
          department: input.department,
          schemeShort: input.schemeShort,
          breedName: input.breedName,
          rates: input.rates,
          language: input.language,
          mode: "final",
          reportTitle: report.title,
          verifyByVetCA: input.verifyByVetCA,
        });
        break;
      case "POULTRY":
        bytes = await buildPoultryReport({
          cover: input.cover,
          location: input.location,
          program: input.program,
          plan: input.plan,
          department: input.department,
          schemeShort: input.schemeShort,
          breedName: input.breedName,
          rates: input.rates,
          language: input.language,
          mode: "final",
          reportTitle: report.title,
          verifyByVetCA: input.verifyByVetCA,
          poultryType: input.poultryType,
        } as any);
        break;
      case "DAIRY":
        bytes = await buildDairyReport({
          cover: input.cover,
          location: input.location,
          program: input.program,
          plan: input.plan,
          department: input.department,
          schemeShort: input.schemeShort,
          breedName: input.breedName,
          rates: input.rates,
          language: input.language,
          mode: "final",
          reportTitle: report.title,
          verifyByVetCA: input.verifyByVetCA,
          dairySpecies: input.dairySpecies,
        } as any);
        break;
      case "PROCESSING":
        bytes = await buildProcessingReport({
          cover: input.cover,
          location: input.location,
          program: input.program,
          plan: input.plan,
          department: input.department,
          schemeShort: input.schemeShort,
          breedName: input.breedName,
          rates: input.rates,
          language: input.language,
          mode: "final",
          reportTitle: report.title,
          verifyByVetCA: input.verifyByVetCA,
        } as any);
        break;
      default:
        return NextResponse.json({ error: "Unsupported animalType" }, { status: 400 });
    }
    const blob = await put(`reports/${session.user.id}/${report.id}.pdf`, Buffer.from(bytes), {
      access: "private",
      contentType: "application/pdf",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      multipart: true,
    });
    await prisma.generatedReport.update({
      where: { id: report.id },
      data: { blobUrl: blob.url, paymentId: payment.id, status: "PAID" },
    });
    return NextResponse.json({ downloadUrl: await getSignedUrl(blob.url) });
  } catch (error) {
    console.error("Report finalize error:", error);
    return NextResponse.json({ error: "Failed to finalize report" }, { status: 500 });
  }
}
