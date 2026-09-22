import { NextResponse, NextRequest } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { checkInteractions, drugsOfChoice, bannedList } from "@/lib/drug-guide";

// { drugs: string[] } -> interaction issues; also ?choice=&species= and ?banned=1 helpers.
export async function POST(req: NextRequest) {
  const rl = await rateLimit(`drug-interact:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.drugs) || body.drugs.length < 1) {
    return NextResponse.json({ error: "drugs: string[] required" }, { status: 400 });
  }
  return NextResponse.json(checkInteractions(body.drugs.map(String).slice(0, 10)));
}

export async function GET(req: NextRequest) {
  const rl = await rateLimit(`drug-guide:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  if (req.nextUrl.searchParams.get("banned") === "1") return NextResponse.json({ results: bannedList() });
  const choice = req.nextUrl.searchParams.get("choice") ?? "";
  const species = req.nextUrl.searchParams.get("species") ?? undefined;
  return NextResponse.json({ results: drugsOfChoice(choice, species) });
}
