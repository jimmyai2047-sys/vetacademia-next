/* eslint-disable @typescript-eslint/no-explicit-any */
// Stored report input is zod-validated but structurally per-animal; the
// builders each declare their own narrow input shape.
import { buildGoatReport } from "@/lib/goat-report-pdf";
import { buildSheepReport } from "@/lib/sheep-report-pdf";
import { buildPigReport } from "@/lib/pig-report-pdf";
import { buildPoultryReport } from "@/lib/poultry-report-pdf";
import { buildDairyReport } from "@/lib/dairy-report-pdf";
import { buildProcessingReport } from "@/lib/processing-report-pdf";
import { buildMeatReport } from "@/lib/meat-report-pdf";

export type ReportBuildOptions = {
  // Builders distinguish "draft" (preview watermark) from "final" (paid PDF).
  mode: "draft" | "final";
  reportTitle: string;
};

// Single dispatcher for a parsed reportInputSchema payload. Kept in one place
// so admin re-generation uses exactly the same builder, field mapping and
// species dispatch as the customer-facing finalize flow — no drift between
// what the buyer paid for and what support regenerates.
export async function buildReportBytes(
  input: any,
  opts: ReportBuildOptions
): Promise<Uint8Array | null> {
  const common = {
    cover: input.cover,
    location: input.location,
    program: input.program,
    plan: input.plan,
    department: input.department,
    schemeShort: input.schemeShort,
    breedName: input.breedName,
    rates: input.rates,
    language: input.language,
    mode: opts.mode,
    reportTitle: opts.reportTitle,
    verifyByVetCA: input.verifyByVetCA,
  };

  switch (input.animalType) {
    case "GOAT":
      return buildGoatReport(common);
    case "SHEEP":
      return buildSheepReport(common);
    case "PIG":
      return buildPigReport(common);
    case "POULTRY":
      return buildPoultryReport({ ...common, poultryType: input.poultryType } as any);
    case "DAIRY":
      return buildDairyReport({ ...common, dairySpecies: input.dairySpecies } as any);
    case "PROCESSING": {
      if (input.processingType === "MEAT") {
        return buildMeatReport({
          ...common,
          breedName: input.breedName,
          species: input.rates?.species,
        } as any);
      }
      return buildProcessingReport(common as any);
    }
    default:
      return null;
  }
}
