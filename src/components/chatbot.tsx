"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

type QA = {
  id: string;
  keywords: string[];
  en: string;
  hi: string;
  // Optional clickable call-to-action shown under the reply.
  cta?: { href: string; en: string; hi: string };
  // Short labels used for suggestion chips.
  chipEn: string;
  chipHi: string;
  // Related QA ids suggested as follow-ups after this answer.
  followups?: string[];
};

const QA: QA[] = [
  {
    id: "programmes",
    keywords: ["program", "programme", "course", "bvsc", "mvsc", "phd", "ahdp", "बीवीएससी", "पाठ्यक्रम", "कोर्स", "कौन", "subject", "विषय"],
    en: "We cover A.H.D.P., B.V.Sc & A.H., M.V.Sc and Ph.D. Open the Syllabus page to browse every subject, unit and chapter.",
    hi: "हम A.H.D.P., B.V.Sc & A.H., M.V.Sc और Ph.D कवर करते हैं। हर विषय, इकाई और अध्याय देखने के लिए Syllabus पेज खोलें।",
    cta: { href: "/syllabus", en: "Browse Syllabus", hi: "Syllabus देखें" },
    chipEn: "Programmes?", chipHi: "पाठ्यक्रम?",
    followups: ["syllabus", "pricing", "admission"],
  },
  {
    id: "admission",
    keywords: ["admission", "enroll", "enrol", "enrollment", "apply", "registration", "join", "दाखिला", "प्रवेश", "नामांकन", "एडमिशन", "आवेदन"],
    en: "You can submit an admission enquiry from the Admission page. Our team will call you about counselling, fees and onboarding.",
    hi: "आप Admission पेज से दाखिले का एनक्वायरी भेज सकते हैं। हमारी टीम फीस और एनरोलमेंट के बारे में आपसे संपर्क करेगी।",
    cta: { href: "/admission", en: "Open Admission Form", hi: "Admission Form खोलें" },
    chipEn: "Admission & Enrollment", chipHi: "दाखिला एवं एनरोलमेंट",
    followups: ["pricing", "about", "contact"],
  },
  {
    id: "about",
    keywords: ["about", "director", "founder", "ashok", "baindha", "who is", "कौन है", "निदेशक", "संस्थापक", "बारे में"],
    en: "VetAcademia was founded by Dr. Ashok Baindha (B.V.Sc & A.H., M.V.Sc, PhD) with 13+ years in teaching, research and extension. Read his full profile.",
    hi: "VetAcademia की स्थापना डॉ. अशोक बैंधा (B.V.Sc & A.H., M.V.Sc, PhD) ने की, जिन्हें 13+ वर्षों का अनुभव है। पूरी प्रोफाइल पढ़ें।",
    cta: { href: "/about", en: "Meet the Director", hi: "निदेशक से मिलें" },
    chipEn: "About / Director", chipHi: "विवरण / निदेशक",
    followups: ["programmes", "admission", "experts"],
  },
  {
    id: "pricing",
    keywords: ["price", "pricing", "cost", "pay", "payment", "buy", "plan", "fee", "fees", "शुल्क", "कीमत", "भुगतान", "खरीद", "प्लान"],
    en: "You can buy a full programme, a single year (BVSc/AHDP), or an individual subject (MVSc/PhD). See all plans and prices on the Pricing page.",
    hi: "आप पूरा पाठ्यक्रम, एक वर्ष (BVSc/AHDP), या एक विषय (MVSc/PhD) खरीद सकते हैं। सभी प्लान और कीमत Pricing पेज पर देखें।",
    cta: { href: "/pricing", en: "View Pricing", hi: "Pricing देखें" },
    chipEn: "Pricing & plans", chipHi: "शुल्क एवं प्लान",
    followups: ["payment", "free", "admission"],
  },
  {
    id: "payment",
    keywords: ["razorpay", "upi", "card", "refund", "cancel", "transaction", "वापसी", "रद्द", "भुगतान", "रेजरपे"],
    en: "Payments are processed securely via Razorpay (UPI, card, net-banking). For refunds or failed transactions, write to us from the Contact page.",
    hi: "भुगतान Razorpay (UPI, कार्ड, नेट-बैंकिंग) से सुरक्षित होते हैं। वापसी या फेल ट्रांजैक्शन के लिए Contact पेज से लिखें।",
    cta: { href: "/contact", en: "Contact Billing", hi: "बिलिंग संपर्क" },
    chipEn: "Payments & refunds", chipHi: "भुगतान एवं वापसी",
    followups: ["pricing", "contact"],
  },
  {
    id: "free",
    keywords: ["free", "trial", "demo", "sample", "preview", "मुफ़्त", "नमूना", "डेमो", "ट्रायल"],
    en: "Yes! A free demo with sample chapters, mock questions and flashcards is available — no payment needed to explore.",
    hi: "हाँ! नमूना अध्याय, मॉक प्रश्न और फ्लैशकार्ड के साथ मुफ़्त डेमो उपलब्ध है — एक्सप्लोर करने के लिए भुगतान ज़रूरी नहीं।",
    cta: { href: "/demo", en: "Try Free Demo", hi: "Free Demo देखें" },
    chipEn: "Free demo", chipHi: "मुफ़्त डेमो",
    followups: ["pricing", "signup"],
  },
  {
    id: "signup",
    keywords: ["register", "signup", "sign up", "account", "create", "login", "log in", "password", "रजिस्टर", "खाता", "अकाउट", "साइनअप", "लॉगिन"],
    en: "Click 'Sign Up' on the top right to create a free account, or 'Login' if you already have one. Use 'Forgot password' to reset.",
    hi: "ऊपर दाएं 'Sign Up' से मुफ़्त खाता बनाएं, या पुराना हो तो 'Login'। पासवर्ड भूले तो 'Forgot password'।",
    cta: { href: "/signup", en: "Create Account", hi: "खाता बनाएं" },
    chipEn: "Sign up / Login", chipHi: "साइनअप / लॉगिन",
    followups: ["free", "pricing"],
  },
  {
    id: "syllabus",
    keywords: ["syllabus", "chapter", "unit", "content", "locked", "unlock", "access", "padhna", "पाठ्यक्रम", "अध्याय", "सिलेबस", "लॉक", "अनलॉक"],
    en: "Each subject shows a 'Syllabus at a Glance' with all units. Locked chapters unlock once you enroll in that programme, year or subject.",
    hi: "हर विषय में 'Syllabus at a Glance' सभी इकाइयों के साथ दिखता है। लॉक अध्याय तब खुलते हैं जब आप पाठ्यक्रम, वर्ष या विषय में एनरोल करते हैं।",
    cta: { href: "/syllabus", en: "Explore Syllabus", hi: "Syllabus देखें" },
    chipEn: "Syllabus access", chipHi: "सिलेबस एक्सेस",
    followups: ["pricing", "study", "mock"],
  },
  {
    id: "study",
    keywords: ["study", "material", "notes", "video", "pdf", "अध्ययन", "नोट्स", "सामग्री", "वीडियो", "पीडीएफ"],
    en: "Study materials (notes, videos, PDFs) are available per subject on the Study Materials page once enrolled.",
    hi: "अध्ययन सामग्री (नोट्स, वीडियो, PDF) एनरोल करने के बाद Study Materials पेज पर विषयवार उपलब्ध हैं।",
    cta: { href: "/study-materials", en: "Study Materials", hi: "Study Materials" },
    chipEn: "Study materials", chipHi: "अध्ययन सामग्री",
    followups: ["mock", "flashcard"],
  },
  {
    id: "mock",
    keywords: ["mock", "test", "quiz", "practice", "pyq", "question paper", "मॉक", "टेस्ट", "परीक्षा", "अभ्यास", "पेपर"],
    en: "Practice with adaptive mock tests and detailed analytics on the Mock Tests page. Previous year papers are on the Papers page.",
    hi: "Mock Tests पेज पर अनुकूली मॉक टेस्ट और विश्लेषण से अभ्यास करें। पिछले वर्षों के पेपर Papers पेज पर हैं।",
    cta: { href: "/mock-tests", en: "Mock Tests", hi: "Mock Tests" },
    chipEn: "Mock tests", chipHi: "मॉक टेस्ट",
    followups: ["paper", "flashcard"],
  },
  {
    id: "paper",
    keywords: ["previous year", "papers", "pyq", "question paper", "पिछले", "पेपर", "प्रश्न पत्र"],
    en: "Previous year papers are on the Papers page. Admins publish them as they become available.",
    hi: "पिछले वर्षों के पेपर Papers पेज पर हैं। एडमिन इन्हें समय-समय पर अपलोड करते हैं।",
    cta: { href: "/papers", en: "Previous Year Papers", hi: "पिछले वर्ष पेपर" },
    chipEn: "PY Papers", chipHi: "पिछले पेपर",
    followups: ["mock", "syllabus"],
  },
  {
    id: "flashcard",
    keywords: ["flashcard", "flash card", "revision", "remember", "फ्लैशकार्ड", "रिवीजन", "याद"],
    en: "Use spaced-repetition Flashcards to revise faster. They're available per subject after enrollment.",
    hi: "तेज़ रिवीजन के लिए spaced-repetition फ्लैशकार्ड का उपयोग करें। एनरोलमेंट के बाद विषयवार मिलते हैं।",
    cta: { href: "/flashcards", en: "Flashcards", hi: "Flashcards" },
    chipEn: "Flashcards", chipHi: "फ्लैशकार्ड",
    followups: ["mock", "study"],
  },
  {
    id: "live",
    keywords: ["live", "class", "session", "webinar", "लाइव", "क्लास", "सत्र"],
    en: "Live classes are scheduled for exam tracks and stream via YouTube Live, with chat and recordings.",
    hi: "लाइव क्लासेस परीक्षा ट्रैक्स के लिए शेड्यूल होती हैं और YouTube Live से चलती हैं, चैट और रिकॉर्डिंग के साथ।",
    cta: { href: "/examinations", en: "Live Classes", hi: "Live Classes" },
    chipEn: "Live classes", chipHi: "लाइव क्लासेस",
    followups: ["experts", "mock"],
  },
  {
    id: "experts",
    keywords: ["expert", "consult", "consultation", "doctor", "vet", "vishnu", "kumar", "विशेषज्ञ", "परामर्श", "डॉक्टर", "वेट", "विष्णु"],
    en: "Book one-on-one sessions with VetAcademia's expert faculty — including subject-matter expert Vishnu Kumar — on the Experts page.",
    hi: "Experts पेज पर VetAcademia के विशेषज्ञ फैकल्टी — जिसमें विषय-विशेषज्ञ Vishnu Kumar भी शामिल हैं — से एक-से-एक परामर्श बुक करें।",
    cta: { href: "/experts", en: "Book Expert", hi: "Expert बुक करें" },
    chipEn: "Expert consult", chipHi: "विशेषज्ञ परामर्श",
    followups: ["community", "contact"],
  },
  {
    id: "community",
    keywords: ["whatsapp", "telegram", "group", "channel", "community", "व्हाट्सएप", "टेलीग्राम", "ग्रुप", "चैनल", "समुदाय"],
    en: "WhatsApp groups and Telegram channels are available on the Community page for enrolled students. Log in and open /community to join.",
    hi: "व्हाट्सएप ग्रुप और टेलीग्राम चैनल नामांकित छात्रों के लिए Community पेज पर उपलब्ध हैं। लॉगिन करें और /community खोलें।",
    cta: { href: "/community", en: "Community", hi: "Community" },
    chipEn: "WhatsApp/Telegram", chipHi: "व्हाट्सएप/टेलीग्राम",
    followups: ["experts", "contact"],
  },
  {
    id: "doubt",
    keywords: ["doubt", "question", "ask", "query", "संदेह", "सवाल", "प्रश्न", "पूछना"],
    en: "You can post subject doubts from the dashboard after login, and our experts answer them. For general queries, use Contact.",
    hi: "लॉगिन के बाद डैशबोर्ड से विषय संबंधी संदेह भेजें, हमारे विशेषज्ञ जवाब देते हैं। सामान्य सवाल के लिए Contact करें।",
    cta: { href: "/contact", en: "Ask / Contact", hi: "पूछें / संपर्क" },
    chipEn: "Ask a doubt", chipHi: "संदेह पूछें",
    followups: ["experts", "community"],
  },
  {
    id: "app",
    keywords: ["app", "android", "mobile", "download", "apk", "ऐप", "एंड्रॉइड", "मोबाइल", "डाउनलोड"],
    en: "VetAcademia has an Android app so you can learn on the go. Download it from the Play Store (link on the site footer/app banner).",
    hi: "VetAcademia का Android ऐप है ताकि आप कहीं भी सीख सकें। इसे Play Store से डाउनलोड करें (साइट पर लिंक उपलब्ध)।",
    chipEn: "Mobile app", chipHi: "मोबाइल ऐप",
    followups: ["signup", "study"],
  },
  {
    id: "language",
    keywords: ["hindi", "english", "language", "भाषा", "हिंदी", "अंग्रेजी"],
    en: "This assistant replies in English and Hindi. Type in either language, or use the EN/हि button to set your preference.",
    hi: "यह सहायक अंग्रेजी और हिंदी दोनों में जवाब देता है। आप किसी भी भाषा में लिखें, या EN/हि बटन से चुनें।",
    chipEn: "Languages", chipHi: "भाषाएँ",
    followups: ["programmes", "admission"],
  },
  {
    id: "contact",
    keywords: ["contact", "support", "help", "संपर्क", "सहायता", "मदद"],
    en: "Visit the Help Center, FAQs, or Contact Us page for support. You can also call or WhatsApp the number on the Contact page.",
    hi: "सहायता के लिए Help Center, FAQs, या Contact Us पेज पर जाएं। Contact पेज पर दिए नंबर पर कॉल/WhatsApp भी कर सकते हैं।",
    cta: { href: "/contact", en: "Contact Support", hi: "सहायता संपर्क" },
    chipEn: "Contact support", chipHi: "सहायता संपर्क",
    followups: ["admission", "about"],
  },
  {
    id: "greeting",
    keywords: ["hello", "hi", "hey", "namaste", "नमस्ते", "हैलो", "हाय"],
    en: "Hello! I'm the VetAcademia assistant. Ask me about programmes, admission, pricing, study materials, or community groups.",
    hi: "नमस्ते! मैं VetAcademia सहायक हूँ। पाठ्यक्रम, दाखिला, शुल्क, अध्ययन सामग्री या समुदाय के बारे में पूछें।",
    chipEn: "How can I help?", chipHi: "मैं कैसे मदद करूँ?",
    followups: ["programmes", "admission", "pricing"],
  },
];

const DEFAULT_SUGGESTIONS = ["programmes", "admission", "pricing", "contact"];

const WELCOME = {
  en: "Hi! I'm the VetAcademia assistant. Ask me about courses, admission, fees, study material or community 👇",
  hi: "नमस्ते! मैं VetAcademia सहायक हूँ। पाठ्यक्रम, दाखिला, शुल्क, अध्ययन सामग्री या समुदाय के बारे में पूछें 👇",
};

const FALLBACK = {
  en: "Sorry, I didn't catch that. Here are a few things I can help with:",
  hi: "माफ़ करें, मैं समझ नहीं पाया। कुछ चीज़ें जिनमें मैं मदद कर सकता हूँ:",
};

const STORAGE_KEY = "va_chat_messages";

function isDevanagari(text: string) {
  return /[\u0900-\u097F]/.test(text);
}

function bestMatch(input: string): QA | null {
  const text = input.toLowerCase();
  let best: QA | null = null;
  let bestScore = 0;
  for (const qa of QA) {
    let score = 0;
    for (const k of qa.keywords) {
      const key = k.toLowerCase();
      if (text === key) score += 3;
      else if (text.includes(key)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = qa;
    }
  }
  return bestScore > 0 ? best : null;
}

function getQA(id: string): QA | undefined {
  return QA.find((q) => q.id === id);
}

type Msg = { from: "bot" | "user"; text: string; cta?: { href: string; label: string } };

const KNOWN_ROUTES = new Set([
  "/syllabus",
  "/admission",
  "/about",
  "/pricing",
  "/signup",
  "/login",
  "/demo",
  "/study-materials",
  "/mock-tests",
  "/papers",
  "/flashcards",
  "/experts",
  "/community",
  "/contact",
]);

// Gemini appends a relevant page path in [brackets] at the end of its reply.
// Strip it and turn it into a clickable CTA.
function extractCta(text: string, lang: "en" | "hi"): { text: string; cta?: { href: string; label: string } } {
  const match = text.match(/\[(\/[a-z0-9\-]+)\]\s*$/i);
  if (match && KNOWN_ROUTES.has(match[1].toLowerCase())) {
    const href = match[1].toLowerCase();
    const label = lang === "hi" ? "पेज खोलें →" : "Open page →";
    return { text: text.replace(/\[(\/[a-z0-9\-]+)\]\s*$/i, "").trim(), cta: { href, label } };
  }
  return { text };
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) return parsed as Msg[];
      }
    } catch {
      /* ignore */
    }
    return [{ from: "bot", text: WELCOME.en }];
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  async function respond(userText: string) {
    const useLang: "en" | "hi" = isDevanagari(userText) ? "hi" : lang;
    const history = messages
      .map((m) => ({ from: m.from, text: m.text }))
      .concat({ from: "user", text: userText });

    setTyping(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (res.ok && data?.reply && !data?.fallback) {
        const { text, cta } = extractCta(data.reply as string, useLang);
        setTyping(false);
        setMessages((m) => [...m, { from: "bot", text, cta }]);
        setSuggestions(DEFAULT_SUGGESTIONS);
        return;
      }
    } catch {
      /* fall through to rule-based */
    }
    ruleBasedAnswer(userText, useLang);
  }

  function ruleBasedAnswer(userText: string, useLang: "en" | "hi") {
    const match = bestMatch(userText);
    window.setTimeout(() => {
      setTyping(false);
      if (match) {
        const cta = match.cta
          ? { href: match.cta.href, label: useLang === "hi" ? match.cta.hi : match.cta.en }
          : undefined;
        setMessages((m) => [
          ...m,
          { from: "bot", text: useLang === "hi" ? match.hi : match.en, cta },
        ]);
        setSuggestions(match.followups ?? DEFAULT_SUGGESTIONS);
      } else {
        setMessages((m) => [
          ...m,
          { from: "bot", text: useLang === "hi" ? FALLBACK.hi : FALLBACK.en },
        ]);
        setSuggestions(DEFAULT_SUGGESTIONS);
      }
    }, 500);
  }

  function send(text: string) {
    const value = text.trim();
    if (!value || typing) return;
    setMessages((m) => [...m, { from: "user", text: value }]);
    setInput("");
    respond(value);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[350px] max-w-[calc(100vw-2.5rem)] h-[520px] max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <span className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> VetAcademia Assistant
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang((l) => (l === "en" ? "hi" : "en"))}
                className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                aria-label="Toggle language"
              >
                {lang === "en" ? "EN" : "हि"}
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close chat">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[82%]">
                  <div
                    className={`rounded-xl px-3 py-2 text-sm ${
                      m.from === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.cta && (
                    <Link
                      href={m.cta.href}
                      onClick={() => setOpen(false)}
                      className="mt-1.5 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      {m.cta.label} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-muted px-3 py-2 text-sm flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 animate-bounce" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {suggestions.map((id) => {
              const q = getQA(id);
              if (!q) return null;
              const label = lang === "hi" ? q.chipHi : q.chipEn;
              return (
                <button
                  key={id}
                  onClick={() => send(label)}
                  className="text-xs rounded-full border px-2.5 py-1 hover:bg-muted"
                >
                  {label}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === "hi" ? "अपना सवाल लिखें..." : "Type your question..."}
              className="flex-1 text-sm rounded-md border px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              aria-label="Send"
              disabled={typing}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
