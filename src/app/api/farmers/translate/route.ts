import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "crypto";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  FARMER_LANG_NAME_EN,
  normalizeFarmerLang,
} from "@/dictionaries/farmer-languages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

// ---- tiny in-process cache (per lambda instance) ----
declare global {
  var __VA_TR_CACHE: Map<string, string> | undefined;
}
const MEM: Map<string, string> =
  globalThis.__VA_TR_CACHE ?? (globalThis.__VA_TR_CACHE = new Map());

function memGet(k: string): string | undefined {
  return MEM.get(k);
}
function memSet(k: string, v: string) {
  if (MEM.size > 3000) {
    const first = MEM.keys().next().value;
    if (first) MEM.delete(first);
  }
  MEM.set(k, v);
}

// ---- optional Upstash Redis cache (shared across instances) ----
async function redisGet(key: string): Promise<string | null> {
  try {
    const url =
      process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
    if (!url || !token) return null;
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return typeof data?.result === "string" ? data.result : null;
  } catch {
    return null;
  }
}

async function redisSet(key: string, value: string) {
  try {
    const url =
      process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
    if (!url || !token) return;
    // 30-day expiry, best-effort
    await fetch(
      `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=2592000`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
  } catch {
    /* cache is optional */
  }
}

const sha = (s: string) => createHash("sha1").update(s).digest("hex");

function extractJsonArray(raw: string): string[] | null {
  if (!raw) return null;
  try {
    const direct = JSON.parse(raw);
    if (Array.isArray(direct) && direct.every((x) => typeof x === "string"))
      return direct as string[];
  } catch {
    /* fall through to bracket scan */
  }
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(raw.slice(start, end + 1));
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string"))
      return parsed as string[];
  } catch {
    return null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`farm-tr:${clientIp(req)}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ fallback: true }, { status: 429 });
  }

  let body: { texts?: unknown; target?: unknown; html?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const texts = Array.isArray(body.texts)
    ? body.texts.filter((t): t is string => typeof t === "string" && t.trim().length > 0).slice(0, 10)
    : [];
  const target = normalizeFarmerLang(body.target);
  const htmlMode = body.html === true;

  if (texts.length === 0) {
    return NextResponse.json({ error: "texts[] required" }, { status: 400 });
  }
  const total = texts.reduce((a, t) => a + t.length, 0);
  if (total > 20000 || texts.some((t) => t.length > 6000)) {
    return NextResponse.json({ error: "Batch too large" }, { status: 413 });
  }

  // English source needs no translation.
  if (target === "en") {
    return NextResponse.json({ translations: texts, cached: true });
  }

  const targetName = FARMER_LANG_NAME_EN[target];
  const out: (string | null)[] = new Array(texts.length).fill(null);
  const missing: { idx: number; text: string; key: string }[] = [];

  for (let i = 0; i < texts.length; i++) {
    const key = `va-tr:v1:${target}:${htmlMode ? "h" : "t"}:${sha(texts[i])}`;
    const hit = memGet(key) ?? (await redisGet(key));
    if (typeof hit === "string" && hit) {
      if (!memGet(key)) memSet(key, hit);
      out[i] = hit;
    } else {
      missing.push({ idx: i, text: texts[i], key });
    }
  }

  if (missing.length === 0) {
    return NextResponse.json({ translations: out, cached: true });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      translations: texts,
      fallback: true,
      reason: "translation-unavailable",
    });
  }

  const numbered = missing
    .map((m, j) => `### ITEM ${j + 1} ###\n${m.text}`)
    .join("\n\n");

  const prompt = `Translate each ITEM below from English (may contain some Hindi) into ${targetName}.
Rules:
- Return ONLY a JSON array of ${missing.length} translated strings, in the same order. No explanation, no markdown fences.
${htmlMode ? "- Each item is an HTML fragment: translate ONLY visible text, keep ALL tags/attributes/structure byte-identical.\n" : ""}- Keep disease names, vaccine/drug brand names, doses (mg/ml), schedules, numbers and ₹ prices in original English; you may add the local term in brackets once if natural.
- Keep emojis and placeholders like {type} unchanged.
- Use simple farmer-friendly language.

${numbered}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: Math.min(8000, Math.max(2000, total * 2)),
        },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    const raw: string = Array.isArray(parts)
      ? parts.map((p: { text?: string }) => p.text || "").join("")
      : "";
    const parsed = extractJsonArray(raw);

    if (!parsed || parsed.length !== missing.length) {
      throw new Error("bad-translation-shape");
    }

    for (let j = 0; j < missing.length; j++) {
      const clean = parsed[j].trim() || missing[j].text;
      out[missing[j].idx] = clean;
      memSet(missing[j].key, clean);
      void redisSet(missing[j].key, clean);
    }
    return NextResponse.json({ translations: out });
  } catch (err) {
    console.error("farmers translate failed:", err);
    return NextResponse.json({ translations: texts, fallback: true });
  }
}
