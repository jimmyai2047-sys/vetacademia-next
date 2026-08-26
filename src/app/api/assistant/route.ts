import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const SYSTEM = `You are "VetAcademia Assistant", the friendly, knowledgeable help desk for VetAcademia — India's dedicated e-learning platform for veterinary and animal-husbandry students and professionals.

BRAND & PRODUCT:
- VetAcademia offers structured courses for A.H.D.P. (Animal Husbandry Diploma), B.V.Sc & A.H., M.V.Sc and Ph.D. programmes.
- Core features: detailed syllabus (subjects → units → chapters), downloadable study materials, adaptive mock tests, flashcards, previous-year question papers, live classes, one-on-one expert consultations, and a learner community (WhatsApp/Telegram). There is an Android app.
- Content is curated by experienced veterinary faculty.

KEY PEOPLE & PAGES:
- Founder & Director: Dr. Ashok Baindha — B.V.Sc & A.H. (CVAS Bikaner, 2009), M.V.Sc (NDRI Karnal, 2011), PhD In-Service (RAJUVAS Bikaner, 2022), UGC NET (2010) & ICAR NET (2011), 13+ years teaching/research/extension, entrepreneurship specialization, 20+ papers/books, NAHEP (World Bank/ICAR) project, Fiji training 2019.
- Admissions: /admission  (enquiry form collects student + parent details, programme, qualification, category, etc.)
- About/Director: /about
- Syllabus: /syllabus  (pick a programme to see the full syllabus tree)
- Pricing/Plans: /pricing (buy a full programme, a year, or a single subject via Razorpay)
- Signup: /signup   Login: /login   Free demo: /demo
- Study materials: /study-materials   Mock tests: /mock-tests   PY papers: /papers   Flashcards: /flashcards
- Experts: /experts — one-on-one expert consultations with VetAcademia's specialist faculty. Notable expert: **Vishnu Kumar** (subject-matter expert available for personal guidance/consultations). Community: /community   Contact: /contact

BEHAVIOUR:
- Reply in the SAME language the user writes (Hindi or English). For Hindi, use Devanagari script.
- Keep replies short and chat-friendly (1–3 sentences). Be accurate; if you do not know a specific detail (e.g. exact fee amounts), say so and point the user to the relevant page.
- Be warm and encouraging, matching the brand's supportive tone.
- If a VetAcademia page would help the user, mention it. When you do, append the exact path in square brackets at the END of your reply, e.g. [/syllabus] or [/admission]. Only use one of these valid paths: /syllabus, /admission, /about, /pricing, /signup, /login, /demo, /study-materials, /mock-tests, /papers, /flashcards, /experts, /community, /contact. Do not invent other paths.
- You are NOT a veterinary doctor — do not give medical diagnosis or treatment advice for animals. For clinical questions, suggest consulting a qualified veterinarian.`;

type InMsg = { from?: string; text?: string };

function toGeminiContents(messages: InMsg[]) {
  const mapped = messages
    .filter((m) => m && typeof m.text === "string" && m.text.trim())
    .map((m) => ({
      role: m.from === "user" ? "user" : "model",
      parts: [{ text: m.text as string }],
    }));

  // Gemini requires the conversation to start with a "user" turn.
  while (mapped.length && mapped[0].role === "model") mapped.shift();

  // Ensure roles alternate (no two consecutive same-role turns).
  const cleaned = [];
  for (const turn of mapped) {
    if (cleaned.length && cleaned[cleaned.length - 1].role === turn.role) continue;
    cleaned.push(turn);
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const isLocal = host && (host.startsWith("localhost") || host.startsWith("127.0.0.1"));
  if (origin && !isLocal && origin.replace(/^https?:\/\//, "") !== host) {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ fallback: true }, { status: 200 });

  let body: { messages?: InMsg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }

  const history = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const contents = toGeminiContents(history);
  if (!contents.length || contents[contents.length - 1].role !== "user") {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          maxOutputTokens: 300,
          stopSequences: [],
        },
      }),
    });

    if (!res.ok) {
      console.error("Gemini API error", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts)
      ? parts.map((p: { text?: string }) => p.text || "").join("")
      : "";
    if (!text) return NextResponse.json({ fallback: true }, { status: 200 });

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Gemini request failed", err);
    return NextResponse.json({ fallback: true }, { status: 200 });
  }
}
