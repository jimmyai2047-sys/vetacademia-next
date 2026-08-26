export const metadata = {
  title: "VetAcademia | FAQs",
  description: "Frequently asked questions about VetAcademia courses, exams, and subscriptions.",
};

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, HelpCircle, ChevronRight } from "lucide-react";
import { DecorativePageHeader } from "@/components/decorative/page-header";

const faqs = [
  {
    q: "What programmes does VetAcademia cover?",
    a: "We cover A.H.D.P., B.V.Sc & A.H., M.V.Sc, and Ph.D programmes with complete curricula, study materials, and mock tests.",
  },
  {
    q: "How do I access study materials and mock tests?",
    a: "Create a free account, then subscribe to the relevant programme or exam track. Subject-wise and year-wise plans are also available for flexible access.",
  },
  {
    q: "Are the mock tests based on the latest syllabus?",
    a: "Yes. Our mock tests and previous year papers are aligned with the current curricula of the respective universities and examining bodies.",
  },
  {
    q: "Can I consult a veterinary expert?",
    a: "Yes. Visit the Experts section to book one-on-one consultations with experienced veterinary professionals.",
  },
  {
    q: "Which payment methods are supported?",
    a: "We support secure online payments. Subscriptions can be purchased for a full programme, a single year, or an individual subject.",
  },
  {
    q: "How do I reset my password?",
    a: "Use the login screen's help options, or contact our support team from the Contact Us page and we will assist you.",
  },
  {
    q: "Is there content in Hindi?",
    a: "The A.H.D.P. syllabus and Livestock Assistant exam preparation are available bilingually (Hindi with English). Other programmes are in English.",
  },
];

export default function FaqsPage() {
  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 pt-8 max-w-3xl">
        <DecorativePageHeader
          badge="FAQs • Quick Answers • Updated Weekly"
          title="Frequently Asked"
          titleHighlight="Questions"
          description="Find quick, decorative answers to common questions about VetAcademia — courses, exams, subscriptions and bilingual content."
          variant="primary"
          actions={
            <>
              <Badge className="rounded-full bg-white/15 backdrop-blur border-white/20 text-white gap-1.5 px-3 py-1.5">
                <HelpCircle className="h-3.5 w-3.5" /> {faqs.length} answers
              </Badge>
              <Badge className="rounded-full bg-white text-primary border-0 px-3 py-1.5">Instant help</Badge>
            </>
          }
        />
      </div>

      <div className="container mx-auto px-4 max-w-3xl">
        <div className="va-divider-dots my-6"><span /></div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.015] to-white pointer-events-none" />
        <div className="absolute inset-0 va-pattern-grid opacity-[0.02] pointer-events-none" />
        <div className="container relative mx-auto px-4 max-w-3xl pb-12">

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/20" />
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> All FAQs</Badge>
            <span className="h-px w-8 bg-gradient-to-r from-primary/20 to-transparent" />
          </div>

          <div className="space-y-4">
            {faqs.map((item, i) => (
              <Card key={i} className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white shadow-sm hover:shadow-lg hover:border-primary/10">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-primary/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="pb-2 relative">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white text-xs font-bold shadow-md mt-0.5">{i + 1}</span>
                    <CardTitle className="text-[17px] leading-snug pt-1 group-hover:text-primary transition-colors">{item.q}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed relative ml-11 border-l-2 border-primary/10 pl-4">
                  {item.a}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="va-divider-dots my-8"><span /></div>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white p-[1px] shadow-xl">
            <div className="rounded-[1.7rem] bg-gradient-to-br from-primary/[0.06] via-white to-blue-50/30 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 va-pattern-grid opacity-[0.03] pointer-events-none" />
              <div className="relative">
                <Badge className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Still stuck?</Badge>
                <p className="font-semibold mt-3 text-lg">Still need help?</p>
                <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-[#d4a843]" />
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#005f48] px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg transition-all shadow-md"
                  >
                    <MessageCircle className="h-4 w-4" /> Contact Us
                  </Link>
                  <Link
                    href="/help"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-sm font-medium hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  >
                    Visit Help Center <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
