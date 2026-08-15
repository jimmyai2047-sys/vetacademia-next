"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type QA = {
  keywords: string[];
  en: string;
  hi: string;
};

const QA: QA[] = [
  {
    keywords: ["program", "programme", "course", "bvsc", "mvsc", "phd", "ahdp", "बीवीएससी", "पाठ्यक्रम", "कोर्स", "कौन"],
    en: "We cover A.H.D.P., B.V.Sc & A.H., M.V.Sc and Ph.D. Browse them on the Syllabus page.",
    hi: "हम A.H.D.P., B.V.Sc & A.H., M.V.Sc और Ph.D कवर करते हैं। इन्हें Syllabus पेज पर देखें।",
  },
  {
    keywords: ["register", "signup", "sign up", "account", "create", "रजिस्टर", "खाता", "अकाउंट", "साइनअप"],
    en: "Click 'Start Free Trial' or 'Sign Up' on the top right to create your free account.",
    hi: "ऊपर दाएं 'Start Free Trial' या 'Sign Up' पर क्लिक करके मुफ़्त खाता बनाएं।",
  },
  {
    keywords: ["price", "pricing", "cost", "pay", "payment", "buy", "plan", "fee", "कीमत", "शुल्क", "भुगतान", "खरीद"],
    en: "You can buy a full programme, a single year (BVSc/AHDP), or an individual subject (MVSc/PhD). See all plans on the Pricing page.",
    hi: "आप पूरा पाठ्यक्रम, एक वर्ष (BVSc/AHDP), या एक विषय (MVSc/PhD) खरीद सकते हैं। सभी प्लान Pricing पेज पर देखें।",
  },
  {
    keywords: ["whatsapp", "telegram", "group", "channel", "community", "व्हाट्सएप", "टेलीग्राम", "ग्रुप", "चैनल", "समुदाय"],
    en: "WhatsApp groups and Telegram channels are available on the Community page for enrolled students. Log in and open /community to join.",
    hi: "व्हाट्सएप ग्रुप और टेलीग्राम चैनल नामांकित छात्रों के लिए Community पेज पर उपलब्ध हैं। लॉगिन करें और /community खोलें।",
  },
  {
    keywords: ["previous year", "papers", "pyq", "question paper", "पिछले", "पेपर", "प्रश्न पत्र"],
    en: "Previous year papers are on the Papers page. Admins publish them as they become available.",
    hi: "पिछले वर्षों के पेपर Papers पेज पर हैं। एडमिन इन्हें समय-समय पर अपलोड करते हैं।",
  },
  {
    keywords: ["mock", "test", "quiz", "मॉक", "टेस्ट", "परीक्षा"],
    en: "Practice with adaptive mock tests and detailed analytics on the Mock Tests page.",
    hi: "Mock Tests पेज पर अभ्यास के लिए मॉक टेस्ट और विश्लेषण उपलब्ध हैं।",
  },
  {
    keywords: ["study", "material", "notes", "video", "अध्ययन", "नोट्स", "सामग्री", "वीडियो"],
    en: "Study materials (notes, videos, PDFs) are available on the Study Materials page.",
    hi: "अध्ययन सामग्री (नोट्स, वीडियो, PDF) Study Materials पेज पर उपलब्ध हैं।",
  },
  {
    keywords: ["expert", "consult", "consultation", "doctor", "विशेषज्ञ", "परामर्श", "डॉक्टर"],
    en: "Book one-on-one sessions with veterinary experts on the Experts page.",
    hi: "Experts पेज पर वेटरनरी विशेषज्ञों से एक-से-एक परामर्श बुक करें।",
  },
  {
    keywords: ["hindi", "english", "language", "भाषा", "हिंदी", "अंग्रेजी"],
    en: "This bot replies in English and Hindi. You can type in either language.",
    hi: "यह बॉट अंग्रेजी और हिंदी दोनों में जवाब देता है। आप किसी भी भाषा में लिखें।",
  },
  {
    keywords: ["contact", "support", "help", "संपर्क", "सहायता", "मदद"],
    en: "Visit the Help Center, FAQs, or Contact Us page for support.",
    hi: "सहायता के लिए Help Center, FAQs, या Contact Us पेज पर जाएं।",
  },
  {
    keywords: ["hello", "hi", "hey", "namaste", "नमस्ते", "हैलो"],
    en: "Hello! I'm the VetAcademia assistant. Ask me about programmes, pricing, study materials, or community groups.",
    hi: "नमस्ते! मैं VetAcademia सहायक हूँ। पाठ्यक्रम, शुल्क, अध्ययन सामग्री या समुदाय ग्रुप के बारे में पूछें।",
  },
];

const SUGGESTIONS = [
  { en: "Programmes?", hi: "पाठ्यक्रम?" },
  { en: "Pricing & plans", hi: "शुल्क एवं प्लान" },
  { en: "WhatsApp/Telegram groups", hi: "व्हाट्सएप/टेलीग्राम ग्रुप" },
  { en: "Contact support", hi: "सहायता संपर्क" },
];

function isDevanagari(text: string) {
  return /[\u0900-\u097F]/.test(text);
}

function answer(input: string, lang: "en" | "hi"): string {
  const text = input.toLowerCase();
  let best: QA | null = null;
  let bestScore = 0;
  for (const qa of QA) {
    let score = 0;
    for (const k of qa.keywords) {
      if (text.includes(k.toLowerCase())) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = qa;
    }
  }
  if (best) return lang === "hi" ? best.hi : best.en;
  return lang === "hi"
    ? "माफ़ करें, मैं समझ नहीं पाया। कृपया programmes, pricing, study materials, या community groups के बारे में पूछें।"
    : "Sorry, I didn't catch that. Try asking about programmes, pricing, study materials, or community groups.";
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [messages, setMessages] = useState<
    { from: "bot" | "user"; text: string }[]
  >([{ from: "bot", text: "Hello! How can I help you today?" }]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function send(text: string) {
    const value = text.trim();
    if (!value) return;
    const useLang = isDevanagari(value) ? "hi" : lang;
    setMessages((m) => [...m, { from: "user", text: value }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: answer(value, useLang) }]);
    }, 350);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[340px] max-w-[calc(100vw-2.5rem)] h-[480px] max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <span className="font-semibold text-sm">VetAcademia Assistant</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang((l) => (l === "en" ? "hi" : "en"))}
                className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
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
              <div
                key={i}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    m.from === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.en}
                onClick={() => send(s[lang])}
                className="text-xs rounded-full border px-2.5 py-1 hover:bg-muted"
              >
                {s[lang]}
              </button>
            ))}
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
              className="rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90"
              aria-label="Send"
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
