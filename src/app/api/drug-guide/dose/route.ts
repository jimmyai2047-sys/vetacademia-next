import { NextResponse, NextRequest } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { calculateDose } from "@/lib/drug-guide";

// Dose calculator: { drug, species, weightKg, concentrationMgPerMl? } -> mg range (+ ml) + warnings.
export async function POST(req: NextRequest) {
  const rl = await rateLimit(`drug-dose:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (!body?.drug || !body?.species || !(body?.weightKg > 0)) {
    return NextResponse.json({ error: "drug, species, weightKg required" }, { status: 400 });
  }
  const conc = body.concentrationMgPerMl != null && Number(body.concentrationMgPerMl) > 0 ? Number(body.concentrationMgPerMl) : undefined;
  const result = calculateDose(String(body.drug), String(body.species), Number(body.weightKg), conc);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json({ ...result, disclaimer: "Teaching reference range — verify label before clinical use." });
}
