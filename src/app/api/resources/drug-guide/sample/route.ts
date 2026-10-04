import { NextResponse, type NextRequest } from "next/server";
import { buildDrugGuidePdf } from "@/lib/drug-guide-pdf";

export const dynamic = "force-dynamic";

// Public sample of the Vet Drug Guide ready reckoner — no sign-in required.
// Returns 2 categories so field vets can preview print layout before signing in
// for the full 170-drug guide at /api/resources/drug-guide.
const SAMPLE_CATEGORIES = ["Antibiotics", "Analgesics-NSAIDs"];

export async function GET(request: NextRequest) {
  const language = request.nextUrl.searchParams.get("language") === "hi" ? "hi" : "en";

  try {
    const pdf = await buildDrugGuidePdf({
      language,
      mode: "final",
      categories: SAMPLE_CATEGORIES,
    });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="vetacademia-drug-guide-sample-${language}.pdf"`,
        "Content-Length": String(pdf.byteLength),
        // Public sample — cacheable at CDN + browser to avoid regenerating.
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("drug-guide sample pdf failed", error);
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }
}
