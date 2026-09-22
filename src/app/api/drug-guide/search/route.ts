import { NextResponse, NextRequest } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { searchDrugs } from "@/lib/drug-guide";
import { DRUG_CATEGORIES, DRUG_COUNT } from "@/lib/drug-master-data";

// Public read-only drug reference search.
export async function GET(req: NextRequest) {
  const rl = await rateLimit(`drug-search:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  if (req.nextUrl.searchParams.get("meta") === "1") {
    return NextResponse.json({ categories: DRUG_CATEGORIES, count: DRUG_COUNT });
  }
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const category = req.nextUrl.searchParams.get("category") ?? undefined;
  const species = req.nextUrl.searchParams.get("species") ?? undefined;
  return NextResponse.json({ results: searchDrugs(q, category, species) });
}
