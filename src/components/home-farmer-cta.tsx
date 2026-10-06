"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight } from "lucide-react";

const copy = {
  en: {
    badge: "For Farmers",
    tags: "Goat • Sheep • Pig • Poultry • Dairy • Processing",
    title: "Bank-loan-ready livestock project reports — NLM-EDP format, free preview",
    sub: "Enter your farm details, preview a bank-format PDF, then download the final report",
    cta: "Create Project Report",
    toggle: "हिंदी",
    toggleLabel: "Switch to Hindi",
  },
  hi: {
    badge: "किसानों के लिए",
    tags: "बकरी • भेड़ • सूअर • मुर्गी • डेयरी • प्रोसेसिंग",
    title: "बैंक-लोन-रेडी पशुधन प्रोजेक्ट रिपोर्ट — NLM-EDP फॉर्मेट, मुफ्त प्रीव्यू",
    sub: "अपने फार्म की जानकारी भरें, बैंक-फॉर्मेट PDF प्रीव्यू देखें, फिर फाइनल रिपोर्ट डाउनलोड करें",
    cta: "प्रोजेक्ट रिपोर्ट बनाएं",
    toggle: "EN",
    toggleLabel: "Switch to English",
  },
} as const;

/** Homepage farmer CTA with an EN / हिंदी toggle so each language view is
 *  internally consistent (no Hinglish mix). Persists via localStorage. */
export default function HomeFarmerCta() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const t = copy[lang];
  return (
    <section className="relative py-6" aria-label="Project reports for farmers">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-[#d4a843]/30 bg-gradient-to-r from-[#d4a843]/[0.12] via-white to-primary/[0.06] p-[1px] shadow-lg">
          <div className="rounded-[1.7rem] bg-gradient-to-r from-[#d4a843]/[0.08] via-white to-primary/[0.04]">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-5 px-6 py-6 md:px-8 md:py-7">
              <div className="flex flex-1 items-start gap-4">
                <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4a843] to-[#9a7a2e] text-white shadow-lg" aria-hidden="true">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge className="rounded-full bg-primary text-white border-0 px-2.5 py-0.5 text-[11px] font-bold tracking-widest uppercase">{t.badge}</Badge>
                    <span className="text-xs font-medium text-primary/60">{t.tags}</span>
                    <button
                      type="button"
                      onClick={() => setLang((l) => (l === "en" ? "hi" : "en"))}
                      aria-label={t.toggleLabel}
                      aria-pressed={lang === "hi"}
                      className="rounded-full border border-primary/20 bg-white px-2.5 py-0.5 text-[11px] font-bold text-primary hover:border-primary/40 transition-colors"
                    >
                      {t.toggle}
                    </button>
                  </div>
                  <p className="text-[17px] font-bold leading-tight text-foreground" lang={lang === "hi" ? "hi" : "en"}>
                    {t.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground" lang={lang === "hi" ? "hi" : "en"}>
                    {t.sub}
                  </p>
                </div>
              </div>
              <Link href="/farmers/project-report" className="w-full sm:w-auto shrink-0">
                <Button size="lg" className="group w-full gap-2 rounded-xl bg-gradient-to-r from-[#d4a843] to-[#9a7a2e] text-white shadow-md hover:shadow-lg sm:w-auto">
                  {t.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[#d4a843]/10 blur-2xl" />
        </div>
      </div>
    </section>
  );
}
