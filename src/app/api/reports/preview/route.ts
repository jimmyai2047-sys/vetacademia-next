import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { reportInputSchema, reportTitle } from "@/lib/report-input";
import { buildGoatReport } from "@/lib/goat-report-pdf";
import { buildSheepReport } from "@/lib/sheep-report-pdf";
import { buildPigReport } from "@/lib/pig-report-pdf";
import { buildPoultryReport } from "@/lib/poultry-report-pdf";
import { buildDairyReport } from "@/lib/dairy-report-pdf";
import { buildProcessingReport } from "@/lib/processing-report-pdf";

// Creates/updates the DRAFT row and returns the watermarked draft PDF bytes.
// The draft is preview-only (served inline, no download) until payment.
export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    const rl = await rateLimit(`report-preview:${clientIp(req)}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const parsed = reportInputSchema.safeParse(body);
    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path.join(".");
        if (!details[k]) details[k] = [];
        details[k].push(issue.message);
      }
      return NextResponse.json({ error: "Invalid input", details }, { status: 400 });
    }
    const input = parsed.data as any;
    const title = reportTitle(input);
    const report = await prisma.generatedReport.create({
      data: {
        userId: session.user.id,
        animalType: input.animalType,
        title,
        language: input.language,
        inputJson: JSON.stringify(input),
        amount: 2500,
        status: "DRAFT",
      },
    });
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
          mode: "draft",
          reportTitle: title,
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
          mode: "draft",
          reportTitle: title,
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
          mode: "draft",
          reportTitle: title,
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
          mode: "draft",
          reportTitle: title,
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
          mode: "draft",
          reportTitle: title,
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
          mode: "draft",
          reportTitle: title,
          verifyByVetCA: input.verifyByVetCA,
        } as any);
        break;
      default:
        return NextResponse.json({ error: "Unsupported animalType" }, { status: 400 });
    }
    const buf = Buffer.from(bytes);
    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "X-Report-Id": report.id,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Report preview error:", error);
    return NextResponse.json({ error: "Failed to build preview" }, { status: 500 });
  }
}
