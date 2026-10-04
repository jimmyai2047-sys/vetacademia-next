import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { buildDrugGuidePdf } from "@/lib/drug-guide-pdf";

export const dynamic = "force-dynamic";

// Account-gated download of the Vet Drug Guide ready reckoner.
// Anonymous visitors get 401 so the calling page can show a sign-in CTA.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "sign_in_required", message: "Sign in to download the ready reckoner." },
      { status: 401 },
    );
  }

  const language = request.nextUrl.searchParams.get("language") === "hi" ? "hi" : "en";

  try {
    const pdf = await buildDrugGuidePdf({ language, mode: "final" });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="vetacademia-drug-guide-${language}.pdf"`,
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("drug-guide pdf failed", error);
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }
}
